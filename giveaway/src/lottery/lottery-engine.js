const crypto = require("crypto");

class LotteryEngine {
  constructor(options = {}) {
    this.seed = options.seed || Date.now();
    this.weightedMode = options.weightedMode || false;
    this.allowDuplicateWins = options.allowDuplicateWins || false;
  }

  drawWinners(participants, numberOfWinners) {
    if (!participants || participants.length === 0) {
      throw new Error("No participants available for lottery");
    }

    if (numberOfWinners > participants.length && !this.allowDuplicateWins) {
      throw new Error(
        `Cannot select ${numberOfWinners} winners from ${participants.length} participants`,
      );
    }

    numberOfWinners = Math.min(numberOfWinners, participants.length);

    if (this.weightedMode) {
      return this.weightedDraw(participants, numberOfWinners);
    } else {
      return this.randomDraw(participants, numberOfWinners);
    }
  }

  randomDraw(participants, numberOfWinners) {
    const shuffled = this.shuffle([...participants]);
    const winners = shuffled.slice(0, numberOfWinners);

    return {
      winners: winners.map((winner, index) => ({
        rank: index + 1,
        username: winner.username,
        types: winner.types || [winner.type],
        drawTime: new Date().toISOString(),
      })),
      totalParticipants: participants.length,
      drawMethod: "random",
      seed: this.seed,
    };
  }

  weightedDraw(participants, numberOfWinners) {
    const weightedPool = this.createWeightedPool(participants);
    const winners = [];
    const usedIndices = new Set();

    for (let i = 0; i < numberOfWinners; i++) {
      let randomIndex;
      do {
        randomIndex = this.getRandomIndex(weightedPool.length);
      } while (
        usedIndices.has(randomIndex) &&
        usedIndices.size < weightedPool.length
      );

      if (usedIndices.size >= weightedPool.length) {
        break;
      }

      usedIndices.add(randomIndex);
      const winnerUsername = weightedPool[randomIndex];
      const winner = participants.find((p) => p.username === winnerUsername);

      winners.push({
        rank: i + 1,
        username: winner.username,
        types: winner.types || [winner.type],
        weight: winner.weight || 1,
        drawTime: new Date().toISOString(),
      });
    }

    return {
      winners,
      totalParticipants: participants.length,
      drawMethod: "weighted",
      seed: this.seed,
    };
  }

  createWeightedPool(participants) {
    const pool = [];

    for (const participant of participants) {
      const weight = participant.weight || participant.types?.length || 1;
      for (let i = 0; i < weight; i++) {
        pool.push(participant.username);
      }
    }

    return this.shuffle(pool);
  }

  shuffle(array) {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = this.getRandomIndex(i + 1);
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  }

  getRandomIndex(max) {
    const hash = crypto.createHash("sha256");
    hash.update(`${this.seed}-${Date.now()}-${Math.random()}`);
    const hex = hash.digest("hex");
    const randomValue = parseInt(hex.substring(0, 8), 16);
    return randomValue % max;
  }

  validateDraw(result, participants, numberOfWinners) {
    if (!result || !result.winners) {
      return { valid: false, reason: "Invalid result structure" };
    }

    if (result.winners.length === 0) {
      return { valid: false, reason: "No winners selected" };
    }

    if (result.winners.length > numberOfWinners) {
      return { valid: false, reason: "Too many winners selected" };
    }

    const uniqueWinners = new Set(result.winners.map((w) => w.username));
    if (
      uniqueWinners.size !== result.winners.length &&
      !this.allowDuplicateWins
    ) {
      return { valid: false, reason: "Duplicate winners found" };
    }

    const participantUsernames = new Set(participants.map((p) => p.username));
    for (const winner of result.winners) {
      if (!participantUsernames.has(winner.username)) {
        return {
          valid: false,
          reason: `Winner ${winner.username} not in participant list`,
        };
      }
    }

    return { valid: true };
  }
}

module.exports = LotteryEngine;

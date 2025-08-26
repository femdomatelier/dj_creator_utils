const fs = require('fs').promises;
const path = require('path');
const chalk = require('chalk');
const createCsvWriter = require('csv-writer').createObjectCsvWriter;

class OutputManager {
    constructor(options = {}) {
        this.format = options.format || 'text';
        this.filePath = options.filePath || null;
        this.verbose = options.verbose || false;
    }

    async output(data) {
        if (this.filePath) {
            // File output: simplified JSON with only essential data
            const simplifiedData = this.formatSimplifiedJSON(data);
            await this.writeToFile(simplifiedData);
            return;
        }

        // Console output: use full formatting
        let formattedOutput;
        switch (this.format.toLowerCase()) {
            case 'json':
                formattedOutput = this.formatJSON(data);
                break;
            case 'csv':
                await this.outputCSV(data);
                return;
            case 'text':
            default:
                formattedOutput = this.formatText(data);
                break;
        }

        console.log(formattedOutput);
    }

    formatJSON(data) {
        return JSON.stringify(data, null, 2);
    }

    formatSimplifiedJSON(data) {
        // Extract all participants
        const allParticipants = [];
        
        // Get participants from the original data processing
        if (data.participants) {
            // If we have direct access to participants
            data.participants.forEach(p => {
                allParticipants.push(p.username);
            });
        } else if (data.result && data.result.winners) {
            // Extract from winners data (this is a fallback, not ideal)
            data.result.winners.forEach(w => {
                allParticipants.push(w.username);
            });
        }

        const simplifiedOutput = {
            winners: data.result?.winners?.map(w => w.username) || [],
            participants: allParticipants,
            seed: data.result?.seed || null,
            timestamp: data.metadata?.timestamp || new Date().toISOString()
        };

        return JSON.stringify(simplifiedOutput, null, 2);
    }

    formatText(data) {
        let output = '';
        
        output += chalk.bold.blue('='.repeat(50)) + '\n';
        output += chalk.bold.white('LOTTERY RESULTS\n');
        output += chalk.bold.blue('='.repeat(50)) + '\n\n';

        if (data.statistics) {
            output += chalk.yellow('STATISTICS:\n');
            output += chalk.gray('─'.repeat(30)) + '\n';
            output += `Total Participants: ${chalk.green(data.statistics.total)}\n`;
            if (data.statistics.retweeters > 0) {
                output += `Retweeters: ${chalk.cyan(data.statistics.retweeters)}\n`;
            }
            if (data.statistics.likers > 0) {
                output += `Likers: ${chalk.magenta(data.statistics.likers)}\n`;
            }
            if (data.statistics.followers > 0) {
                output += `Followers: ${chalk.blue(data.statistics.followers)}\n`;
            }
            if (data.statistics.multipleActions > 0) {
                output += `Multiple Actions: ${chalk.yellow(data.statistics.multipleActions)}\n`;
            }
            output += '\n';
        }

        if (data.result && data.result.winners) {
            output += chalk.yellow('WINNERS:\n');
            output += chalk.gray('─'.repeat(30)) + '\n';
            
            for (const winner of data.result.winners) {
                output += `#${winner.rank} - ${chalk.green('@' + winner.username)}`;
                
                if (winner.types && winner.types.length > 0) {
                    const typeLabels = winner.types.join(', ');
                    output += ` (${typeLabels})`;
                }
                
                if (winner.weight && data.result.drawMethod === 'weighted') {
                    output += chalk.gray(` (weight: ${winner.weight})`);
                }
                
                output += '\n';
            }
            output += '\n';
        }

        if (data.metadata) {
            output += chalk.gray('METADATA:\n');
            output += chalk.gray('─'.repeat(30)) + '\n';
            output += chalk.gray(`Draw Method: ${data.result?.drawMethod || 'random'}\n`);
            output += chalk.gray(`Timestamp: ${data.metadata.timestamp}\n`);
            if (data.metadata.tweetUrl) {
                output += chalk.gray(`Tweet: ${data.metadata.tweetUrl}\n`);
            }
            output += chalk.gray(`Seed: ${data.result?.seed || 'N/A'}\n`);
        }

        output += '\n' + chalk.bold.blue('='.repeat(50)) + '\n';
        
        return output;
    }

    async outputCSV(data) {
        if (!data.result || !data.result.winners) {
            throw new Error('No winners to export to CSV');
        }

        const csvPath = this.filePath || 'lottery_results.csv';
        
        const records = data.result.winners.map(winner => ({
            rank: winner.rank,
            username: winner.username,
            types: (winner.types || []).join(', '),
            weight: winner.weight || 1,
            drawTime: winner.drawTime
        }));

        const csvWriter = createCsvWriter({
            path: csvPath,
            header: [
                { id: 'rank', title: 'Rank' },
                { id: 'username', title: 'Username' },
                { id: 'types', title: 'Participation Types' },
                { id: 'weight', title: 'Weight' },
                { id: 'drawTime', title: 'Draw Time' }
            ]
        });

        await csvWriter.writeRecords(records);
        
        console.log(chalk.green(`Results exported to ${csvPath}`));
        
        if (this.verbose) {
            console.log(chalk.gray(`Total winners: ${records.length}`));
        }
    }

    async writeToFile(content) {
        try {
            await fs.writeFile(this.filePath, content, 'utf8');
            console.log(chalk.green(`Results saved to ${this.filePath}`));
        } catch (error) {
            console.error(chalk.red(`❌ Failed to write to file: ${error.message}`));
            console.log(content);
        }
    }

    getRankEmoji(rank) {
        return '';
    }

    getTypeIcon(type) {
        return type;
    }

    outputError(error) {
        console.error(chalk.red('ERROR:'), error.message);
        if (this.verbose && error.stack) {
            console.error(chalk.gray(error.stack));
        }
    }

    outputWarning(message) {
        console.warn(chalk.yellow('WARNING:'), message);
    }

    outputInfo(message) {
        if (this.verbose) {
            console.log(chalk.blue('INFO:'), message);
        }
    }

    outputSuccess(message) {
        console.log(chalk.green('SUCCESS:'), message);
    }
}

module.exports = OutputManager;
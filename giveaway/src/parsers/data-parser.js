class DataParser {
    constructor(options = {}) {
        this.removeDuplicates = options.removeDuplicates !== false;
        this.filters = options.filters || {};
    }

    parseUsers(retweeters = [], likers = [], followers = []) {
        let allUsers = [];

        if (retweeters.length > 0) {
            allUsers = allUsers.concat(retweeters.map(user => ({
                username: user,
                type: 'retweet',
                source: 'retweet'
            })));
        }

        if (likers.length > 0) {
            allUsers = allUsers.concat(likers.map(user => ({
                username: user,
                type: 'like',
                source: 'like'
            })));
        }

        if (followers.length > 0) {
            allUsers = allUsers.concat(followers.map(user => ({
                username: user,
                type: 'follower',
                source: 'follower'
            })));
        }

        if (this.removeDuplicates) {
            allUsers = this.deduplicateUsers(allUsers);
        }

        return this.applyFilters(allUsers);
    }

    deduplicateUsers(users) {
        const userMap = new Map();
        
        for (const user of users) {
            if (!userMap.has(user.username)) {
                userMap.set(user.username, {
                    username: user.username,
                    types: new Set([user.type]),
                    sources: new Set([user.source])
                });
            } else {
                const existing = userMap.get(user.username);
                existing.types.add(user.type);
                existing.sources.add(user.source);
            }
        }

        return Array.from(userMap.values()).map(user => ({
            username: user.username,
            types: Array.from(user.types),
            sources: Array.from(user.sources),
            weight: user.types.size
        }));
    }

    applyFilters(users) {
        let filteredUsers = users;

        if (this.filters.requireRetweet) {
            filteredUsers = filteredUsers.filter(user => 
                user.types && user.types.includes('retweet') || 
                user.type === 'retweet'
            );
        }

        if (this.filters.requireFollow) {
            filteredUsers = filteredUsers.filter(user => 
                user.types && user.types.includes('follower') ||
                user.type === 'follower'
            );
        }

        if (this.filters.requireLike) {
            filteredUsers = filteredUsers.filter(user => 
                user.types && user.types.includes('like') ||
                user.type === 'like'
            );
        }

        if (this.filters.excludeUsernames && Array.isArray(this.filters.excludeUsernames)) {
            const excludeSet = new Set(this.filters.excludeUsernames.map(u => u.toLowerCase()));
            filteredUsers = filteredUsers.filter(user => 
                !excludeSet.has(user.username.toLowerCase())
            );
        }

        if (this.filters.includeUsernames && Array.isArray(this.filters.includeUsernames)) {
            const includeSet = new Set(this.filters.includeUsernames.map(u => u.toLowerCase()));
            filteredUsers = filteredUsers.filter(user => 
                includeSet.has(user.username.toLowerCase())
            );
        }

        return filteredUsers;
    }

    getStatistics(users) {
        const stats = {
            total: users.length,
            retweeters: 0,
            likers: 0,
            followers: 0,
            multipleActions: 0
        };

        for (const user of users) {
            if (user.types) {
                if (user.types.includes('retweet')) stats.retweeters++;
                if (user.types.includes('like')) stats.likers++;
                if (user.types.includes('follower')) stats.followers++;
                if (user.types.length > 1) stats.multipleActions++;
            } else {
                if (user.type === 'retweet') stats.retweeters++;
                if (user.type === 'like') stats.likers++;
                if (user.type === 'follower') stats.followers++;
            }
        }

        return stats;
    }
}

module.exports = DataParser;
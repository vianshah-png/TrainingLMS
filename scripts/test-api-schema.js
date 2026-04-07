async function testApi() {
    try {
        const response = await fetch('https://bn-new-api.balancenutritiononline.com/api/v1/social-posts/all', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({})
        });
        const full = await response.json();
        const root = Array.isArray(full) ? full[0] : full;
        
        let records = [];
        if (Array.isArray(root.data)) {
            records = root.data;
        } else if (root.data?.records) {
            records = root.data.records;
        } else if (root.data?.[0]?.records) {
            records = root.data[0].records;
        }
        
        if (records.length === 0) {
            console.log('--- DATA DISCOVERY ---');
            console.log(JSON.stringify(root, null, 2).slice(0, 1000));
            return;
        }

        const stats = {
            postTypes: new Set(),
            postSubTypes: new Set(),
            tags: new Set(),
            total: records.length
        };

        records.forEach(r => {
            if (r.postType) stats.postTypes.add(r.postType);
            if (r.postSubType) stats.postSubTypes.add(r.postSubType);
            if (r.tags && typeof r.tags === 'string') {
                r.tags.split(',').forEach(t => stats.tags.add(t.trim().toLowerCase()));
            }
        });

        console.log('--- API INSIGHTS ---');
        console.log('Total Records:', stats.total);
        console.log('Post Types:', Array.from(stats.postTypes));
        console.log('Sub Types:', Array.from(stats.postSubTypes));
        
        console.log('\n--- SAMPLE CATEGORIZATION MAP ---');
        const snippets = records.slice(0, 3).map(r => ({
           title: r.title,
           type: r.postType,
           st: r.postSubType,
           tags: r.tags
        }));
        console.log(snippets);

    } catch (e) {
        console.error('Fetch error:', e);
    }
}
testApi();

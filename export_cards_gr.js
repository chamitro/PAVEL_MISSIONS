const puppeteer = require('puppeteer');
const path = require('path');
const fs = require('fs');

const OUTPUT_DIR = path.join(__dirname, 'all_cards_gr');
const HTML_FILE = path.join(__dirname, 'latest_cards', 'cards_v3', 'card_generator_gr.html');

async function exportCards() {
    console.log('Launching browser (Greek edition)...');
    const browser = await puppeteer.launch({
        headless: 'new',
        executablePath: '/usr/bin/google-chrome',
        args: ['--no-sandbox', '--disable-setuid-sandbox', '--allow-file-access-from-files', '--disable-gpu']
    });

    const page = await browser.newPage();

    // Set high DPI for crisp PNGs
    await page.setViewport({ width: 1400, height: 900, deviceScaleFactor: 3 });

    const fileUrl = 'file://' + HTML_FILE;
    console.log('Loading:', fileUrl);
    await page.goto(fileUrl, { waitUntil: 'networkidle0', timeout: 30000 });

    // Show all sections
    await page.evaluate(() => showSection('all'));
    await new Promise(r => setTimeout(r, 1000));

    // Create output directories
    const dirs = ['missions', 'group_missions', 'heroes', 'stats', 'world_book', 'rules_book'];
    dirs.forEach(d => {
        const dirPath = path.join(OUTPUT_DIR, d);
        if (!fs.existsSync(dirPath)) fs.mkdirSync(dirPath, { recursive: true });
    });

    // ---- MISSIONS (100) ----
    console.log('\n--- Exporting Mission Cards (GR) ---');
    const missionCards = await page.$$('#missions-grid .mission-card');
    console.log(`Found ${missionCards.length} mission cards`);

    const missionNames = await page.evaluate(() => {
        return STAGES.map((m, i) => {
            const num = String(i + 1).padStart(3, '0');
            return `${num}_mission`;
        });
    });

    for (let i = 0; i < missionCards.length; i++) {
        const filename = `${missionNames[i]}.png`;
        const outPath = path.join(OUTPUT_DIR, 'missions', filename);
        await missionCards[i].screenshot({ path: outPath, type: 'png', omitBackground: true });
        process.stdout.write(`\r  Mission ${i + 1}/${missionCards.length}: ${filename}`);
    }
    console.log('\n  Done!');

    // ---- GROUP MISSIONS (50) ----
    console.log('\n--- Exporting Group Mission Cards (GR) ---');
    const groupCards = await page.$$('#group-grid .mission-card');
    console.log(`Found ${groupCards.length} group mission cards`);

    const groupNames = await page.evaluate(() => {
        return GROUP_STAGES.map((m, i) => {
            const num = String(i + 1).padStart(2, '0');
            return `${num}_group`;
        });
    });

    for (let i = 0; i < groupCards.length; i++) {
        const filename = `${groupNames[i]}.png`;
        const outPath = path.join(OUTPUT_DIR, 'group_missions', filename);
        await groupCards[i].screenshot({ path: outPath, type: 'png', omitBackground: true });
        process.stdout.write(`\r  Group ${i + 1}/${groupCards.length}: ${filename}`);
    }
    console.log('\n  Done!');

    // ---- HEROES (20) ----
    console.log('\n--- Exporting Hero Cards (GR) ---');
    const heroCards = await page.$$('#heroes-grid .hero-card');
    console.log(`Found ${heroCards.length} hero cards`);

    const heroNames = await page.evaluate(() => {
        return HEROES.map(h => h.n.replace(/\s+/g, '_'));
    });

    for (let i = 0; i < heroCards.length; i++) {
        const filename = `${heroNames[i]}.png`;
        const outPath = path.join(OUTPUT_DIR, 'heroes', filename);
        await heroCards[i].screenshot({ path: outPath, type: 'png', omitBackground: true });
        process.stdout.write(`\r  Hero ${i + 1}/${heroCards.length}: ${filename}`);
    }
    console.log('\n  Done!');

    // ---- STAT CARDS (5) ----
    console.log('\n--- Exporting Stat Cards (GR) ---');
    const statCards = await page.$$('#stats-grid .stat-card');
    console.log(`Found ${statCards.length} stat cards`);

    const statNames = ['POW', 'SPD', 'BRN', 'CHA', 'WIL'];

    for (let i = 0; i < statCards.length; i++) {
        const filename = `${statNames[i] || 'stat_' + i}.png`;
        const outPath = path.join(OUTPUT_DIR, 'stats', filename);
        await statCards[i].screenshot({ path: outPath, type: 'png', omitBackground: true });
        process.stdout.write(`\r  Stat ${i + 1}/${statCards.length}: ${filename}`);
    }
    console.log('\n  Done!');

    // ---- WORLD BOOK PAGES ----
    console.log('\n--- Exporting World Book Pages (GR) ---');
    const worldPages = await page.$$('#world-grid .book-page');
    console.log(`Found ${worldPages.length} world book pages`);

    const worldPageNames = ['00_Cover', '01_World_Map', '02_Pavel_Town', '03_Visitors_and_Threat', '04_Heroes_Part1', '05_Heroes_Part2'];
    for (let i = 0; i < worldPages.length; i++) {
        const filename = `${worldPageNames[i] || 'page_' + i}.png`;
        const outPath = path.join(OUTPUT_DIR, 'world_book', filename);
        await worldPages[i].screenshot({ path: outPath, type: 'png', omitBackground: true });
        process.stdout.write(`\r  World ${i + 1}/${worldPages.length}: ${filename}`);
    }
    console.log('\n  Done!');

    // ---- RULES BOOK PAGES ----
    console.log('\n--- Exporting Rules Book Pages (GR) ---');
    const rulesPages = await page.$$('#rules-grid .book-page');
    console.log(`Found ${rulesPages.length} rules book pages`);

    const rulesPageNames = ['00_Cover', '01_Setup_and_Objective', '02_Challenge_Resolution', '03_Group_Missions_and_Affinity', '04_Hero_Abilities_Part1', '05_Hero_Abilities_Part2', '06_Winning_and_Strategy'];
    for (let i = 0; i < rulesPages.length; i++) {
        const filename = `${rulesPageNames[i] || 'page_' + i}.png`;
        const outPath = path.join(OUTPUT_DIR, 'rules_book', filename);
        await rulesPages[i].screenshot({ path: outPath, type: 'png', omitBackground: true });
        process.stdout.write(`\r  Rules ${i + 1}/${rulesPages.length}: ${filename}`);
    }
    console.log('\n  Done!');

    await browser.close();

    // Print summary
    console.log('\n========================================');
    console.log('GREEK EXPORT COMPLETE!');
    console.log('========================================');
    let total = 0;
    dirs.forEach(d => {
        const dirPath = path.join(OUTPUT_DIR, d);
        if (fs.existsSync(dirPath)) {
            const files = fs.readdirSync(dirPath).filter(f => f.endsWith('.png'));
            console.log(`  ${d}/: ${files.length} files`);
            total += files.length;
        }
    });
    console.log(`  TOTAL: ${total} PNG files`);
    console.log(`  Output: ${OUTPUT_DIR}`);
}

exportCards().catch(err => {
    console.error('Export failed:', err);
    process.exit(1);
});

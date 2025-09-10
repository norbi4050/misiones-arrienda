const puppeteer = require('puppeteer');

class FrontendFiltersTester {
    constructor() {
        this.baseUrl = 'http://localhost:3000';
        this.browser = null;
        this.page = null;
        this.testResults = {
            ui: [],
            urlPersistence: [],
            badges: [],
            pagination: []
        };
    }

    async init() {
        console.log('🚀 Initializing Puppeteer browser...');
        this.browser = await puppeteer.launch({
            headless: false, // Set to true for headless mode
            args: ['--no-sandbox', '--disable-setuid-sandbox']
        });
        this.page = await this.browser.newPage();
        await this.page.setViewport({ width: 1200, height: 800 });
    }

    async close() {
        if (this.browser) {
            await this.browser.close();
        }
    }

    // Test UI Controls Visibility
    async testUIControls() {
        console.log('🖥️ Testing UI Controls Visibility...\n');

        try {
            await this.page.goto(`${this.baseUrl}/properties`, { waitUntil: 'networkidle2' });

            // Wait for filter section to load
            await this.page.waitForSelector('[data-testid="filter-section"]', { timeout: 10000 });

            const controls = [
                { name: 'minArea input', selector: '[data-testid="min-area-input"]' },
                { name: 'maxArea input', selector: '[data-testid="max-area-input"]' },
                { name: 'amenities input', selector: '[data-testid="amenities-input"]' },
                { name: 'province input', selector: '[data-testid="province-input"]' },
                { name: 'priceMin input', selector: '[data-testid="price-min-input"]' },
                { name: 'priceMax input', selector: '[data-testid="price-max-input"]' },
                { name: 'bedroomsMin input', selector: '[data-testid="bedrooms-min-input"]' },
                { name: 'bathroomsMin input', selector: '[data-testid="bathrooms-min-input"]' },
                { name: 'orderBy select', selector: '[data-testid="order-by-select"]' },
                { name: 'order select', selector: '[data-testid="order-select"]' }
            ];

            for (const control of controls) {
                try {
                    const element = await this.page.$(control.selector);
                    const isVisible = element !== null;

                    this.testResults.ui.push({
                        control: control.name,
                        selector: control.selector,
                        visible: isVisible,
                        success: isVisible
                    });

                    console.log(`${control.name}: ${isVisible ? '✅ VISIBLE' : '❌ NOT FOUND'}`);
                } catch (error) {
                    console.log(`${control.name}: ❌ ERROR - ${error.message}`);
                    this.testResults.ui.push({
                        control: control.name,
                        selector: control.selector,
                        visible: false,
                        success: false,
                        error: error.message
                    });
                }
            }

        } catch (error) {
            console.log(`❌ UI Controls test failed: ${error.message}`);
        }
    }

    // Test URL Persistence
    async testURLPersistence() {
        console.log('\n🔗 Testing URL Persistence...\n');

        const testFilters = [
            {
                name: 'Area filters',
                params: 'minArea=80&maxArea=200',
                expectedInURL: ['minArea=80', 'maxArea=200']
            },
            {
                name: 'Amenities filter',
                params: 'amenities=pool,garage',
                expectedInURL: ['amenities=pool', 'garage']
            },
            {
                name: 'Province filter',
                params: 'province=Misiones',
                expectedInURL: ['province=Misiones']
            },
            {
                name: 'Price range',
                params: 'priceMin=100000&priceMax=300000',
                expectedInURL: ['priceMin=100000', 'priceMax=300000']
            },
            {
                name: 'Complex filters',
                params: 'minArea=80&maxArea=200&amenities=pool&province=Misiones&bedroomsMin=2&orderBy=area&order=desc',
                expectedInURL: ['minArea=80', 'maxArea=200', 'amenities=pool', 'province=Misiones', 'bedroomsMin=2', 'orderBy=area', 'order=desc']
            }
        ];

        for (const test of testFilters) {
            try {
                console.log(`Testing: ${test.name}`);

                // Navigate with filters
                const url = `${this.baseUrl}/properties?${test.params}`;
                await this.page.goto(url, { waitUntil: 'networkidle2' });

                // Wait a bit for URL to stabilize
                await this.page.waitForTimeout(1000);

                const currentURL = this.page.url();
                console.log(`  Current URL: ${currentURL}`);

                // Check if expected parameters are in URL
                let allParamsPresent = true;
                for (const expected of test.expectedInURL) {
                    if (!currentURL.includes(expected)) {
                        allParamsPresent = false;
                        break;
                    }
                }

                this.testResults.urlPersistence.push({
                    test: test.name,
                    url: currentURL,
                    expectedParams: test.expectedInURL,
                    allParamsPresent: allParamsPresent,
                    success: allParamsPresent
                });

                console.log(`  Result: ${allParamsPresent ? '✅ ALL PARAMS PRESENT' : '❌ MISSING PARAMS'}`);

            } catch (error) {
                console.log(`  ❌ ERROR: ${error.message}`);
                this.testResults.urlPersistence.push({
                    test: test.name,
                    success: false,
                    error: error.message
                });
            }
        }
    }

    // Test Active Badges
    async testActiveBadges() {
        console.log('\n🏷️ Testing Active Badges...\n');

        const badgeTests = [
            {
                name: 'Area range badge',
                params: 'minArea=80&maxArea=200',
                expectedBadge: '80-200 m²'
            },
            {
                name: 'Amenities badge',
                params: 'amenities=pool',
                expectedBadge: 'pool'
            },
            {
                name: 'Province badge',
                params: 'province=Misiones',
                expectedBadge: 'Misiones'
            },
            {
                name: 'Price range badge',
                params: 'priceMin=100000&priceMax=300000',
                expectedBadge: '$100,000-$300,000'
            }
        ];

        for (const test of badgeTests) {
            try {
                console.log(`Testing: ${test.name}`);

                await this.page.goto(`${this.baseUrl}/properties?${test.params}`, { waitUntil: 'networkidle2' });

                // Look for active filter badges
                const badges = await this.page.$$eval('[data-testid="active-filter-badge"]', elements =>
                    elements.map(el => el.textContent.trim())
                );

                console.log(`  Found badges: ${JSON.stringify(badges)}`);

                const badgeFound = badges.some(badge =>
                    badge.includes(test.expectedBadge) ||
                    badge.toLowerCase().includes(test.expectedBadge.toLowerCase())
                );

                this.testResults.badges.push({
                    test: test.name,
                    expectedBadge: test.expectedBadge,
                    foundBadges: badges,
                    badgeFound: badgeFound,
                    success: badgeFound
                });

                console.log(`  Result: ${badgeFound ? '✅ BADGE FOUND' : '❌ BADGE NOT FOUND'}`);

            } catch (error) {
                console.log(`  ❌ ERROR: ${error.message}`);
                this.testResults.badges.push({
                    test: test.name,
                    success: false,
                    error: error.message
                });
            }
        }
    }

    // Test Pagination
    async testPagination() {
        console.log('\n📄 Testing Pagination...\n');

        try {
            // Test with filters applied
            await this.page.goto(`${this.baseUrl}/properties?minArea=80&maxArea=200&limit=12&offset=0`, { waitUntil: 'networkidle2' });

            // Check if pagination controls exist
            const paginationExists = await this.page.$('[data-testid="pagination-controls"]') !== null;
            const prevButton = await this.page.$('[data-testid="pagination-prev"]') !== null;
            const nextButton = await this.page.$('[data-testid="pagination-next"]') !== null;

            console.log(`Pagination controls: ${paginationExists ? '✅ EXISTS' : '❌ NOT FOUND'}`);
            console.log(`Previous button: ${prevButton ? '✅ EXISTS' : '❌ NOT FOUND'}`);
            console.log(`Next button: ${nextButton ? '✅ EXISTS' : '❌ NOT FOUND'}`);

            // Test pagination with offset
            if (nextButton) {
                await this.page.click('[data-testid="pagination-next"]');
                await this.page.waitForTimeout(1000);

                const newURL = this.page.url();
                const hasOffset = newURL.includes('offset=12');

                console.log(`After next click - URL: ${newURL}`);
                console.log(`Offset parameter: ${hasOffset ? '✅ PRESENT' : '❌ MISSING'}`);

                this.testResults.pagination.push({
                    test: 'Pagination navigation',
                    paginationExists: paginationExists,
                    prevButton: prevButton,
                    nextButton: nextButton,
                    offsetUpdated: hasOffset,
                    success: paginationExists && hasOffset
                });
            } else {
                this.testResults.pagination.push({
                    test: 'Pagination controls',
                    paginationExists: paginationExists,
                    prevButton: prevButton,
                    nextButton: nextButton,
                    success: false,
                    note: 'Next button not found'
                });
            }

        } catch (error) {
            console.log(`❌ Pagination test failed: ${error.message}`);
            this.testResults.pagination.push({
                test: 'Pagination test',
                success: false,
                error: error.message
            });
        }
    }

    // Generate Report
    generateReport() {
        console.log('\n📊 FRONTEND TESTING REPORT\n');
        console.log('='.repeat(80));

        // UI Controls Results
        console.log('🖥️ UI CONTROLS VISIBILITY');
        console.log('-'.repeat(40));

        const uiPass = this.testResults.ui.filter(t => t.success).length;
        const uiTotal = this.testResults.ui.length;
        console.log(`UI Controls: ${uiPass}/${uiTotal} PASSED\n`);

        this.testResults.ui.forEach((test, i) => {
            console.log(`${i + 1}. ${test.control}`);
            console.log(`   Visible: ${test.visible ? '✅' : '❌'}`);
            console.log(`   Result: ${test.success ? 'PASS' : 'FAIL'}`);
            if (test.error) console.log(`   Error: ${test.error}`);
            console.log();
        });

        // URL Persistence Results
        console.log('🔗 URL PERSISTENCE');
        console.log('-'.repeat(40));

        const urlPass = this.testResults.urlPersistence.filter(t => t.success).length;
        const urlTotal = this.testResults.urlPersistence.length;
        console.log(`URL Persistence: ${urlPass}/${urlTotal} PASSED\n`);

        this.testResults.urlPersistence.forEach((test, i) => {
            console.log(`${i + 1}. ${test.test}`);
            console.log(`   URL: ${test.url || 'N/A'}`);
            console.log(`   All params present: ${test.allParamsPresent ? '✅' : '❌'}`);
            console.log(`   Result: ${test.success ? 'PASS' : 'FAIL'}`);
            if (test.error) console.log(`   Error: ${test.error}`);
            console.log();
        });

        // Badges Results
        console.log('🏷️ ACTIVE BADGES');
        console.log('-'.repeat(40));

        const badgePass = this.testResults.badges.filter(t => t.success).length;
        const badgeTotal = this.testResults.badges.length;
        console.log(`Active Badges: ${badgePass}/${badgeTotal} PASSED\n`);

        this.testResults.badges.forEach((test, i) => {
            console.log(`${i + 1}. ${test.test}`);
            console.log(`   Expected: ${test.expectedBadge}`);
            console.log(`   Found: ${JSON.stringify(test.foundBadges)}`);
            console.log(`   Badge found: ${test.badgeFound ? '✅' : '❌'}`);
            console.log(`   Result: ${test.success ? 'PASS' : 'FAIL'}`);
            if (test.error) console.log(`   Error: ${test.error}`);
            console.log();
        });

        // Pagination Results
        console.log('📄 PAGINATION');
        console.log('-'.repeat(40));

        const paginationPass = this.testResults.pagination.filter(t => t.success).length;
        const paginationTotal = this.testResults.pagination.length;
        console.log(`Pagination: ${paginationPass}/${paginationTotal} PASSED\n`);

        this.testResults.pagination.forEach((test, i) => {
            console.log(`${i + 1}. ${test.test}`);
            console.log(`   Controls exist: ${test.paginationExists ? '✅' : '❌'}`);
            console.log(`   Prev button: ${test.prevButton ? '✅' : '❌'}`);
            console.log(`   Next button: ${test.nextButton ? '✅' : '❌'}`);
            console.log(`   Offset updated: ${test.offsetUpdated ? '✅' : '❌'}`);
            console.log(`   Result: ${test.success ? 'PASS' : 'FAIL'}`);
            if (test.error) console.log(`   Error: ${test.error}`);
            console.log();
        });

        // Overall Summary
        console.log('🎯 OVERALL SUMMARY');
        console.log('-'.repeat(40));

        const totalTests = uiTotal + urlTotal + badgeTotal + paginationTotal;
        const totalPass = uiPass + urlPass + badgePass + paginationPass;

        console.log(`Total Tests: ${totalPass}/${totalTests} PASSED`);
        console.log(`Success Rate: ${((totalPass / totalTests) * 100).toFixed(1)}%`);

        console.log('\n' + '='.repeat(80));
        console.log('REPORT GENERATED AT:', new Date().toISOString());
    }

    // Main execution
    async runTests() {
        try {
            await this.init();
            await this.testUIControls();
            await this.testURLPersistence();
            await this.testActiveBadges();
            await this.testPagination();
            this.generateReport();
        } catch (error) {
            console.error('❌ Frontend testing failed:', error);
        } finally {
            await this.close();
        }
    }
}

// Export for use in other scripts
module.exports = { FrontendFiltersTester };

// Run if called directly
if (require.main === module) {
    const tester = new FrontendFiltersTester();
    tester.runTests();
}

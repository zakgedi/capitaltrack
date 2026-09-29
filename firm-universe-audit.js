/* LP Globe firm-universe audit, September 29, 2026. New institutional allocators only.
   Each description and person note links to the source; no guessed emails or LinkedIn URLs.
   Append-only to preserve existing index-based pipeline and saved relationship keys. */
(function () {
  if (typeof firms === 'undefined' || !Array.isArray(firms)) return;
  const additions = [
    {
      name: 'Golden Bell Partners, LLC', type: 'FoF', location: 'Charlottesville, Virginia',
      aum: '~$1.15B', rank: '3 (med)', rankNum: 3,
      description: 'Golden Bell Partners is a private-markets investment adviser founded in 2014. It advises six private pooled vehicles investing primarily in private-equity funds and direct private-equity opportunities. Its March 2026 SEC brochure reports $1.150 billion in discretionary client assets as of September 30, 2025. Source: https://files.adviserinfo.sec.gov/IAPD/Content/Common/crd_iapd_Brochure.aspx?BRCHR_VRSN_ID=1016718',
      contacts: [{name:'Edward P. Hutchinson',role:'Principal owner and investment decision maker',decisionMaker:true,unverified:false,notes:'Source: https://files.adviserinfo.sec.gov/IAPD/Content/Common/crd_iapd_Brochure.aspx?BRCHR_VRSN_ID=1016718'}]
    },
    {
      name: 'University of Michigan Investment Office', type: 'Endowment', location: 'Ann Arbor, Michigan',
      aum: '~$21.2B', rank: '5 (high)', rankNum: 5,
      description: 'The Investment Office manages the university endowment within its long-term portfolio. The endowment was valued at $21.2 billion on June 30, 2025. Sources: https://bf.umich.edu/investment-office/ and https://publicaffairs.vpcomm.umich.edu/wp-content/uploads/sites/19/2025/12/2025-Endowment-Profile.pdf',
      contacts: [{name:'Erik Lundberg',role:'Chief Investment Officer',decisionMaker:true,unverified:false,notes:'Source: https://bf.umich.edu/leadership'}]
    },
    {
      name: 'Gates Foundation Trust', type: 'Foundation', location: 'Seattle, Washington',
      aum: '~$89.3B investments', rank: '5 (high)', rankNum: 5,
      description: 'The trust holds and manages donated investment assets for the Gates Foundation. Its audited December 31, 2025 financial statement reports $89.346 billion in investments (and $93.168 billion in total assets). This is the investment trust, not a separate investment team: its assets are managed by Cascade Asset Management Company, which already has a firm record here. Sources: https://www.gatesfoundation.org/about/financials/foundation-trust and https://docs.gatesfoundation.org/documents/2025_gatesfoundationtrust_fs.pdf',
      contacts: []
    },
    {
      name: 'Wellcome Trust', type: 'Foundation', location: 'London, UK',
      aum: '~£39.9B portfolio', rank: '5 (high)', rankNum: 5,
      description: 'Wellcome is an independent charitable foundation financed by an internally managed investment portfolio. Its investment page reports a £39.9 billion portfolio. Sources: https://wellcome.org/about-us/investments and https://wellcome.org/news/wellcome-announces-new-leadership-investment-team-retirement-nick-moakes',
      contacts: [
        {name:'Lisha Patel',role:'Managing Partner and Co-Chief Investment Officer',decisionMaker:true,unverified:false,notes:'Source: https://wellcome.org/news/wellcome-announces-new-leadership-investment-team-retirement-nick-moakes'},
        {name:'Fabian Thehos',role:'Managing Partner and Co-Chief Investment Officer',decisionMaker:true,unverified:false,notes:'Source: https://wellcome.org/news/wellcome-announces-new-leadership-investment-team-retirement-nick-moakes'}
      ]
    },
    {
      name: 'British Columbia Investment Management Corporation (BCI)', type: 'Public pension', location: 'Victoria, British Columbia',
      aum: '~C$313.7B gross assets', rank: '5 (high)', rankNum: 5,
      description: 'BCI invests for British Columbia public-sector pension and other institutional clients, with C$313.7 billion in gross managed assets as of March 31, 2026. Sources: https://www.bci.ca/about/about-bci/ and https://www.bci.ca/about/leadership/executive-management-team/',
      contacts: [
        {name:'Gordon J. Fyfe',role:'Chief Executive Officer / Chief Investment Officer',decisionMaker:true,unverified:false,notes:'Source: https://www.bci.ca/bio/gordon-j-fyfe/'},
        {name:'Jon Salon',role:'Executive Vice President & Global Head, Private Equity',decisionMaker:true,unverified:false,notes:'Source: https://www.bci.ca/bio/jon-salon/'},
        {name:'Daniel Garant',role:'Executive Vice President & Global Head, Capital Markets & Credit Investments',decisionMaker:true,unverified:false,notes:'Source: https://www.bci.ca/about/leadership/executive-management-team/'},
        {name:'Ramy Rayes',role:'Executive Vice President, Investment Strategy & Risk',decisionMaker:true,unverified:false,notes:'Source: https://www.bci.ca/about/leadership/executive-management-team/'},
        {name:'Lincoln H Webb',role:'Executive Vice President & Global Head, Infrastructure & Renewable Resources',decisionMaker:true,unverified:false,notes:'Source: https://www.bci.ca/about/leadership/executive-management-team/'}
      ]
    },
    {
      name: 'Norges Bank Investment Management (Government Pension Fund Global)', type: 'Sovereign wealth', location: 'Oslo, Norway',
      aum: '~NOK 21.27T', rank: '5 (high)', rankNum: 5,
      description: 'Norges Bank Investment Management manages Norway’s Government Pension Fund Global. The fund was worth NOK 21,268 billion at the end of 2025. Sources: https://www.nbim.no/en/news-and-insights/reports/2025/annual-report-2025/web-report-annual-report-2025/ and https://www.nbim.no/en/about-us/leader-group/',
      contacts: [
        {name:'Nicolai Tangen',role:'Chief Executive Officer',decisionMaker:true,unverified:false,notes:'Source: https://www.nbim.no/en/about-us/leader-group/leadergroup-persons/nicolai-tangen/'},
        {name:'Malin Norberg',role:'Chief Investment Officer, Market Strategies',decisionMaker:true,unverified:false,notes:'Source: https://www.nbim.no/en/about-us/leader-group/'},
        {name:'Pedro Furtado Reis',role:'Co-Chief Investment Officer, Active Strategies',decisionMaker:true,unverified:false,notes:'Source: https://www.nbim.no/en/about-us/leader-group/'},
        {name:'Daniel Balthasar',role:'Co-Chief Investment Officer, Active Strategies',decisionMaker:true,unverified:false,notes:'Source: https://www.nbim.no/en/about-us/leader-group/'}
      ]
    },
    {
      name: 'Pantheon', type: 'FoF', location: 'London, UK',
      aum: '~$83.8B discretionary AUM', rank: '5 (high)', rankNum: 5,
      description: 'Pantheon allocates across private-equity primaries, secondaries, co-investments, private credit and real assets. Its company site reports $83.8 billion in discretionary assets under management as of December 31, 2025. Sources: https://www.pantheon.com/who-we-are/ and https://www.pantheon.com/investment-approach/private-equity/',
      contacts: [
        {name:'Jeff Miller',role:'Chief Investment Officer',decisionMaker:true,unverified:false,notes:'Source: https://www.pantheon.com/investment-approach/private-equity/'},
        {name:'Imogen Richards',role:'Partner, London',decisionMaker:true,unverified:false,notes:'Source: https://www.pantheon.com/investment-approach/private-equity/'},
        {name:'Brian Buenneke',role:'Partner, San Francisco',decisionMaker:true,unverified:false,notes:'Source: https://www.pantheon.com/investment-approach/private-equity/'},
        {name:'Matthew Cashion',role:'Partner, New York',decisionMaker:true,unverified:false,notes:'Source: https://www.pantheon.com/investment-approach/private-equity/'},
        {name:'Amyn Hassanally',role:'Partner, New York',decisionMaker:true,unverified:false,notes:'Source: https://www.pantheon.com/investment-approach/private-equity/'},
        {name:'Brian Lim',role:'Partner, Singapore',decisionMaker:true,unverified:false,notes:'Source: https://www.pantheon.com/investment-approach/private-equity/'}
      ]
    },
    {
      name: 'National Pension Service Investment Management (South Korea)', type: 'Public pension', location: 'Jeonju, South Korea',
      aum: '~KRW 1,865.6T', rank: '5 (high)', rankNum: 5,
      description: 'The investment arm of South Korea’s National Pension Service manages the National Pension Fund, which reached KRW 1,865.6 trillion at June 30, 2026. Sources: https://fund.nps.or.kr/eng/main.do and https://fund.nps.or.kr/eng/aboutus/ognz/getOHFB0006M0.do',
      contacts: [
        {name:'Won-Joo Seo',role:'Executive Fund Director & Chief Investment Officer',decisionMaker:true,unverified:false,notes:'Source: https://fund.nps.or.kr/eng/aboutus/ognz/getOHFB0006M0.do'},
        {name:'Hyung-Don Choe',role:'Head, Private Equity & Venture Capital Investment Division',decisionMaker:true,unverified:false,notes:'Source: https://fund.nps.or.kr/eng/aboutus/ognz/getOHFB0006M0.do'},
        {name:'Hyup Son',role:'Head, Investment Strategy Division',decisionMaker:true,unverified:false,notes:'Source: https://fund.nps.or.kr/eng/aboutus/ognz/getOHFB0006M0.do'},
        {name:'Jun-sang Ahn',role:'Head, Real Estate Investment Division',decisionMaker:true,unverified:false,notes:'Source: https://fund.nps.or.kr/eng/aboutus/ognz/getOHFB0006M0.do'}
      ]
    },
    {
      name: 'Alberta Investment Management Corporation (AIMCo)', type: 'Public pension', location: 'Edmonton, Alberta',
      aum: '>C$200B', rank: '5 (high)', rankNum: 5,
      description: 'AIMCo invests for Alberta pensions and public-sector institutions. It reported client assets exceeding C$200 billion in the first half of 2026. Sources: https://www.aimco.ca/insights/2026-mid-year-investment-performance and https://www.aimco.ca/who-we-are/leadership',
      contacts: [
        {name:'Justin Lord',role:'Chief Investment Officer',decisionMaker:true,unverified:false,notes:'Source: https://www.aimco.ca/who-we-are/leadership'},
        {name:'Peter Teti',role:'Senior Executive Managing Director, Global Head of Private Assets',decisionMaker:true,unverified:false,notes:'Source: https://www.aimco.ca/who-we-are/leadership'},
        {name:'Ben Hawkins',role:'Executive Managing Director, Global Head of Infrastructure, Renewable Resources and Energy Transition',decisionMaker:true,unverified:false,notes:'Source: https://www.aimco.ca/who-we-are/leadership'},
        {name:'David Tiley',role:'Senior Managing Director, Global Head of Public Equities',decisionMaker:true,unverified:false,notes:'Source: https://www.aimco.ca/who-we-are/leadership'}
      ]
    },
    {
      name: 'AustralianSuper', type: 'Public pension', location: 'Melbourne, Australia',
      aum: '>A$430B', rank: '5 (high)', rankNum: 5,
      description: 'AustralianSuper is a profit-for-member superannuation fund managing more than A$430 billion in retirement savings for over 3.6 million members. Sources: https://www.australiansuper.com/about-us and https://www.australiansuper.com/global-investors/capabilities/investment-team',
      contacts: [
        {name:'Shaun Manuell',role:'Chief Investment Officer',decisionMaker:true,unverified:false,notes:'Source: https://www.australiansuper.com/global-investors/capabilities/investment-team'},
        {name:'Mark Hargraves',role:'Head of International & Private Equity',decisionMaker:true,unverified:false,notes:'Source: https://www.australiansuper.com/global-investors/capabilities/investment-team'},
        {name:'Alistair Barker',role:'Head of Asset Allocation',decisionMaker:true,unverified:false,notes:'Source: https://www.australiansuper.com/global-investors/capabilities/investment-team'},
        {name:'Katie Dean',role:'Head of Fixed Income & Currency',decisionMaker:true,unverified:false,notes:'Source: https://www.australiansuper.com/global-investors/capabilities/investment-team'}
      ]
    },
    {
      name: 'APG Asset Management', type: 'Public pension', location: 'Amsterdam, Netherlands',
      aum: '~€601B', rank: '5 (high)', rankNum: 5,
      description: 'APG manages assets on behalf of four Dutch pension funds, reporting €601 billion at year-end 2025. Sources: https://assetmanagement.apg.nl/media/k3ybol42/apg-annual-report-2025.pdf and https://assetmanagement.apg.nl/our-leadership/',
      contacts: [
        {name:'Alineke van den Berge',role:'Chief Executive Officer and Chief Operating Officer',decisionMaker:true,unverified:false,notes:'Source: https://assetmanagement.apg.nl/our-leadership/'},
        {name:'Herman Slooijer',role:'CIO, Capital Markets',decisionMaker:true,unverified:false,notes:'Source: https://assetmanagement.apg.nl/our-leadership/'},
        {name:'Patrick Kanters',role:'CIO, Private Investments',decisionMaker:true,unverified:false,notes:'Source: https://assetmanagement.apg.nl/our-leadership/'},
        {name:'Rianne Lemsom',role:'Chief Fiduciary Officer',decisionMaker:true,unverified:false,notes:'Source: https://assetmanagement.apg.nl/our-leadership/'}
      ]
    },
    {
      name: 'Builders Vision', type: 'SFO', location: 'Chicago, Illinois',
      aum: '>$15B managed', rank: '4 (high)', rankNum: 4,
      description: 'Lukas Walton’s investment and philanthropy platform manages more than $15 billion across taxable portfolios, a foundation endowment, donor-advised funds and catalytic capital. It is separate from Walton Enterprises. Sources: https://www.buildersvision.com/who-we-are/ and https://www.buildersvision.com/what-we-do/',
      contacts: [
        {name:'Noelle Laing',role:'Chief Investment Officer',decisionMaker:true,unverified:false,notes:'Source: https://www.buildersvision.com/who-we-are/noelle-laing/'},
        {name:'Jamey Spencer',role:'Managing Director, Head of Private Markets',decisionMaker:true,unverified:false,notes:'Source: https://www.buildersvision.com/who-we-are/jamey-spencer/'},
        {name:'Danielle Reed',role:'Managing Director, Investments',decisionMaker:true,unverified:false,notes:'Source: https://www.buildersvision.com/who-we-are/danielle-reed/'},
        {name:'Kurt Braitberg',role:'Managing Director, Head of Public Markets',decisionMaker:true,unverified:false,notes:'Source: https://www.buildersvision.com/who-we-are/kurt-braitberg/'}
      ]
    },
    {
      name: 'Walton Enterprises / WIT, LLC', type: 'SFO', location: 'Washington, DC',
      aum: '', rank: '4 (high)', rankNum: 4,
      description: 'WIT, LLC is the investment team of Walton Enterprises, the family office serving descendants of Sam and Helen Walton. Its SEC 13F filing lists a Washington, DC office; the filing is not a measure of total assets. Sources: https://missioninvestors.org/redhen/org/3265 and https://www.sec.gov/Archives/edgar/data/1840025/000110465925078246/0001104659-25-078246.txt',
      contacts: [{name:'Kevin Stephenson',role:'President, WIT, LLC',decisionMaker:true,unverified:false,notes:'Source: https://www.uarkfoundation.org/about/directors/'}]
    }
  ];
  const existing = new Set(firms.map(f => f.name.toLocaleLowerCase()));
  for (const firm of additions) {
    const key = firm.name.toLocaleLowerCase();
    if (existing.has(key)) continue;
    firm.notes = firm.contacts.length ? firm.contacts.length + ' sourced investment staff' : 'Investment staff roster not publicly confirmed';
    firm.novaRank = firms.length + 1;
    firms.push(firm);
    existing.add(key);
  }
  if (typeof renderKpis === 'function') renderKpis();
  if (typeof renderListRows === 'function') renderListRows();
  if (typeof initGlobe === 'function') initGlobe();
})();

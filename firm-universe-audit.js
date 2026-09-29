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
      description: 'The trust holds and manages donated investment assets for the Gates Foundation. Its audited December 31, 2025 financial statement reports $89.346 billion in investments (and $93.168 billion in total assets). This is the investment trust, distinct from Cascade Investment and the foundation’s grant-making operations. Sources: https://www.gatesfoundation.org/about/financials/foundation-trust and https://docs.gatesfoundation.org/documents/2025_gatesfoundationtrust_fs.pdf',
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

export const fetchSecurities = async () => {
    const response = await fetch('/securities');
    return response.json();
};

export const fetchSecurityDetail = async (securityId) => {
    const response = await fetch(`/securities/${securityId}`);
    return response.json();
};

export const fetchMarketRatios = async () => {
    const response = await fetch('/market-ratios');
    return response.json();
};

export const fetchMarketRatioDetail = async (marketRatioId) => {
    const response = await fetch(`/market-ratios/${marketRatioId}`);
    return response.json();
};

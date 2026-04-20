/**
 * Reference Games Library
 * 
 * A structured dataset of ~100 real slot games for similarity matching,
 * benchmarking, and market analysis in LaunchIndex.
 */

export interface ReferenceGame {
  name: string;
  provider: string;
  releaseYear: number;
  themeCategories: string[];
  gameplayStructure: string;
  features: string[];
  volatility: "Low" | "Medium" | "High" | "Very High";
  volatilityScore: number;
  hitFrequency: "Low" | "Medium" | "High";
  featureDensity: "Low" | "Medium" | "High";
  topWin: number;
  rtpRange: [number, number];
  marketPresence: "Low" | "Medium" | "High";
  targetMarkets: string[];
}

export const referenceGamesLibrary: ReferenceGame[] = [
  /* ===== PRAGMATIC PLAY ===== */
  {
    name: "Sweet Bonanza",
    provider: "Pragmatic Play",
    releaseYear: 2019,
    themeCategories: ["Candy", "Casual"],
    gameplayStructure: "Cluster Pays",
    features: ["Free Spins", "Multipliers", "Cascades"],
    volatility: "High",
    volatilityScore: 0.8,
    hitFrequency: "Medium",
    featureDensity: "High",
    topWin: 21000,
    rtpRange: [96.48, 96.51],
    marketPresence: "High",
    targetMarkets: ["Global"]
  },
  {
    name: "Gates of Olympus",
    provider: "Pragmatic Play",
    releaseYear: 2021,
    themeCategories: ["Mythology"],
    gameplayStructure: "Payways",
    features: ["Multipliers", "Free Spins"],
    volatility: "High",
    volatilityScore: 0.85,
    hitFrequency: "Medium",
    featureDensity: "Medium",
    topWin: 5000,
    rtpRange: [96.5, 96.5],
    marketPresence: "High",
    targetMarkets: ["Global"]
  },
  {
    name: "Sugar Rush",
    provider: "Pragmatic Play",
    releaseYear: 2022,
    themeCategories: ["Candy"],
    gameplayStructure: "Cluster Pays",
    features: ["Multipliers", "Free Spins"],
    volatility: "High",
    volatilityScore: 0.8,
    hitFrequency: "High",
    featureDensity: "High",
    topWin: 5000,
    rtpRange: [96.5, 96.5],
    marketPresence: "High",
    targetMarkets: ["Global"]
  },
  {
    name: "Fruit Party",
    provider: "Pragmatic Play",
    releaseYear: 2020,
    themeCategories: ["Fruit"],
    gameplayStructure: "Cluster Pays",
    features: ["Multipliers", "Cascades"],
    volatility: "High",
    volatilityScore: 0.8,
    hitFrequency: "High",
    featureDensity: "Medium",
    topWin: 5000,
    rtpRange: [96.5, 96.5],
    marketPresence: "High",
    targetMarkets: ["Global"]
  },
  {
    name: "Big Bass Bonanza",
    provider: "Pragmatic Play",
    releaseYear: 2020,
    themeCategories: ["Fishing"],
    gameplayStructure: "Paylines",
    features: ["Free Spins", "Collection"],
    volatility: "Medium",
    volatilityScore: 0.65,
    hitFrequency: "Medium",
    featureDensity: "Medium",
    topWin: 2100,
    rtpRange: [96.71, 96.71],
    marketPresence: "High",
    targetMarkets: ["Global"]
  },
  {
    name: "The Dog House",
    provider: "Pragmatic Play",
    releaseYear: 2019,
    themeCategories: ["Animals"],
    gameplayStructure: "Paylines",
    features: ["Sticky Wilds", "Free Spins"],
    volatility: "Medium",
    volatilityScore: 0.6,
    hitFrequency: "Medium",
    featureDensity: "Medium",
    topWin: 5000,
    rtpRange: [96.51, 96.51],
    marketPresence: "High",
    targetMarkets: ["Global"]
  },
  {
    name: "Wild West Gold",
    provider: "Pragmatic Play",
    releaseYear: 2021,
    themeCategories: ["Wild West"],
    gameplayStructure: "Paylines",
    features: ["Multipliers", "Free Spins"],
    volatility: "High",
    volatilityScore: 0.75,
    hitFrequency: "Medium",
    featureDensity: "Medium",
    topWin: 5000,
    rtpRange: [96.51, 96.51],
    marketPresence: "High",
    targetMarkets: ["Global"]
  },
  {
    name: "Madame Destiny Megaways",
    provider: "Pragmatic Play",
    releaseYear: 2020,
    themeCategories: ["Mystic"],
    gameplayStructure: "Megaways",
    features: ["Free Spins", "Multipliers"],
    volatility: "High",
    volatilityScore: 0.8,
    hitFrequency: "Low",
    featureDensity: "Medium",
    topWin: 5000,
    rtpRange: [96.58, 96.58],
    marketPresence: "Medium",
    targetMarkets: ["EU"]
  },
  {
    name: "John Hunter and the Tomb of the Scarab Queen",
    provider: "Pragmatic Play",
    releaseYear: 2020,
    themeCategories: ["Adventure", "Egypt"],
    gameplayStructure: "Paylines",
    features: ["Free Spins", "Multipliers"],
    volatility: "High",
    volatilityScore: 0.8,
    hitFrequency: "Low",
    featureDensity: "Medium",
    topWin: 5000,
    rtpRange: [96.5, 96.5],
    marketPresence: "Medium",
    targetMarkets: ["EU"]
  },
  {
    name: "Great Rhino Megaways",
    provider: "Pragmatic Play",
    releaseYear: 2020,
    themeCategories: ["Animals"],
    gameplayStructure: "Megaways",
    features: ["Free Spins"],
    volatility: "High",
    volatilityScore: 0.8,
    hitFrequency: "Low",
    featureDensity: "Medium",
    topWin: 20000,
    rtpRange: [96.58, 96.58],
    marketPresence: "Medium",
    targetMarkets: ["EU"]
  },

  /* ===== PLAY'N GO ===== */
  {
    name: "Book of Dead",
    provider: "Play'n GO",
    releaseYear: 2016,
    themeCategories: ["Egypt", "Adventure"],
    gameplayStructure: "Paylines",
    features: ["Free Spins", "Expanding Symbols"],
    volatility: "High",
    volatilityScore: 0.8,
    hitFrequency: "Low",
    featureDensity: "Low",
    topWin: 5000,
    rtpRange: [96.2, 96.2],
    marketPresence: "High",
    targetMarkets: ["EU"]
  },
  {
    name: "Reactoonz",
    provider: "Play'n GO",
    releaseYear: 2017,
    themeCategories: ["Cartoon", "Sci-Fi"],
    gameplayStructure: "Cluster Pays",
    features: ["Cascades", "Grid Features"],
    volatility: "Medium",
    volatilityScore: 0.6,
    hitFrequency: "High",
    featureDensity: "High",
    topWin: 4500,
    rtpRange: [96.51, 96.51],
    marketPresence: "High",
    targetMarkets: ["EU"]
  },
  {
    name: "Rise of Olympus",
    provider: "Play'n GO",
    releaseYear: 2015,
    themeCategories: ["Mythology"],
    gameplayStructure: "Cluster Pays",
    features: ["Cascades", "Multipliers"],
    volatility: "Medium",
    volatilityScore: 0.6,
    hitFrequency: "High",
    featureDensity: "Medium",
    topWin: 5000,
    rtpRange: [96.5, 96.5],
    marketPresence: "Medium",
    targetMarkets: ["EU"]
  },
  {
    name: "Legacy of Dead",
    provider: "Play'n GO",
    releaseYear: 2018,
    themeCategories: ["Egypt"],
    gameplayStructure: "Paylines",
    features: ["Free Spins", "Expanding Symbols"],
    volatility: "High",
    volatilityScore: 0.85,
    hitFrequency: "Low",
    featureDensity: "Low",
    topWin: 5000,
    rtpRange: [96.58, 96.58],
    marketPresence: "High",
    targetMarkets: ["EU"]
  },
  {
    name: "Moon Princess",
    provider: "Play'n GO",
    releaseYear: 2017,
    themeCategories: ["Anime"],
    gameplayStructure: "Cluster Pays",
    features: ["Multipliers", "Cascades"],
    volatility: "Medium",
    volatilityScore: 0.6,
    hitFrequency: "High",
    featureDensity: "High",
    topWin: 5000,
    rtpRange: [96.5, 96.5],
    marketPresence: "Medium",
    targetMarkets: ["EU"]
  },
  {
    name: "Boat Bonanza",
    provider: "Play'n GO",
    releaseYear: 2021,
    themeCategories: ["Fishing"],
    gameplayStructure: "Paylines",
    features: ["Free Spins", "Collection"],
    volatility: "Medium",
    volatilityScore: 0.65,
    hitFrequency: "Medium",
    featureDensity: "Medium",
    topWin: 3000,
    rtpRange: [96.2, 96.2],
    marketPresence: "Medium",
    targetMarkets: ["EU"]
  },

  /* ===== NETENT ===== */
  {
    name: "Starburst",
    provider: "NetEnt",
    releaseYear: 2012,
    themeCategories: ["Classic"],
    gameplayStructure: "Paylines",
    features: ["Expanding Wilds"],
    volatility: "Low",
    volatilityScore: 0.3,
    hitFrequency: "High",
    featureDensity: "Low",
    topWin: 500,
    rtpRange: [96.1, 96.1],
    marketPresence: "High",
    targetMarkets: ["Global"]
  },
  {
    name: "Dead or Alive 2",
    provider: "NetEnt",
    releaseYear: 2019,
    themeCategories: ["Wild West"],
    gameplayStructure: "Paylines",
    features: ["Sticky Wilds", "Free Spins"],
    volatility: "Very High",
    volatilityScore: 0.95,
    hitFrequency: "Low",
    featureDensity: "Medium",
    topWin: 111111,
    rtpRange: [96.8, 96.8],
    marketPresence: "High",
    targetMarkets: ["EU"]
  },
  {
    name: "Gonzo's Quest",
    provider: "NetEnt",
    releaseYear: 2011,
    themeCategories: ["Adventure"],
    gameplayStructure: "Avalanche",
    features: ["Cascades", "Multipliers"],
    volatility: "Medium",
    volatilityScore: 0.6,
    hitFrequency: "Medium",
    featureDensity: "Medium",
    topWin: 2500,
    rtpRange: [95.97, 95.97],
    marketPresence: "High",
    targetMarkets: ["Global"]
  },
  {
    name: "Twin Spin",
    provider: "NetEnt",
    releaseYear: 2013,
    themeCategories: ["Classic"],
    gameplayStructure: "Paylines",
    features: ["Linked Reels"],
    volatility: "Medium",
    volatilityScore: 0.5,
    hitFrequency: "Medium",
    featureDensity: "Low",
    topWin: 1000,
    rtpRange: [96.6, 96.6],
    marketPresence: "Medium",
    targetMarkets: ["EU"]
  },

  /* ===== PUSH GAMING ===== */
  {
    name: "Jammin' Jars",
    provider: "Push Gaming",
    releaseYear: 2018,
    themeCategories: ["Music"],
    gameplayStructure: "Cluster Pays",
    features: ["Multipliers", "Moving Symbols"],
    volatility: "High",
    volatilityScore: 0.75,
    hitFrequency: "Medium",
    featureDensity: "High",
    topWin: 20000,
    rtpRange: [96.83, 96.83],
    marketPresence: "High",
    targetMarkets: ["EU"]
  },
  {
    name: "Razor Shark",
    provider: "Push Gaming",
    releaseYear: 2021,
    themeCategories: ["Ocean"],
    gameplayStructure: "Paylines",
    features: ["Free Spins", "Multipliers"],
    volatility: "Very High",
    volatilityScore: 0.95,
    hitFrequency: "Low",
    featureDensity: "Medium",
    topWin: 50000,
    rtpRange: [96.7, 96.7],
    marketPresence: "High",
    targetMarkets: ["EU"]
  },
  {
    name: "Fat Rabbit",
    provider: "Push Gaming",
    releaseYear: 2019,
    themeCategories: ["Animals"],
    gameplayStructure: "Paylines",
    features: ["Expanding Symbols"],
    volatility: "Medium",
    volatilityScore: 0.6,
    hitFrequency: "Medium",
    featureDensity: "Low",
    topWin: 5000,
    rtpRange: [96.71, 96.71],
    marketPresence: "Medium",
    targetMarkets: ["EU"]
  },

  /* ===== BIG TIME GAMING ===== */
  {
    name: "Bonanza",
    provider: "Big Time Gaming",
    releaseYear: 2016,
    themeCategories: ["Mining"],
    gameplayStructure: "Megaways",
    features: ["Free Spins", "Multipliers"],
    volatility: "High",
    volatilityScore: 0.8,
    hitFrequency: "Medium",
    featureDensity: "Medium",
    topWin: 12000,
    rtpRange: [96, 96],
    marketPresence: "High",
    targetMarkets: ["EU"]
  },
  {
    name: "Extra Chilli",
    provider: "Big Time Gaming",
    releaseYear: 2018,
    themeCategories: ["Mexican"],
    gameplayStructure: "Megaways",
    features: ["Bonus Buy", "Free Spins"],
    volatility: "High",
    volatilityScore: 0.85,
    hitFrequency: "Low",
    featureDensity: "High",
    topWin: 20000,
    rtpRange: [96.82, 96.82],
    marketPresence: "Medium",
    targetMarkets: ["EU"]
  },

  /* ===== HACKSAW ===== */
  {
    name: "Wanted Dead or a Wild",
    provider: "Hacksaw Gaming",
    releaseYear: 2022,
    themeCategories: ["Wild West"],
    gameplayStructure: "Paylines",
    features: ["Multipliers", "Free Spins"],
    volatility: "Very High",
    volatilityScore: 0.95,
    hitFrequency: "Low",
    featureDensity: "High",
    topWin: 12500,
    rtpRange: [96.38, 96.38],
    marketPresence: "High",
    targetMarkets: ["EU"]
  },
  {
    name: "Chaos Crew",
    provider: "Hacksaw Gaming",
    releaseYear: 2023,
    themeCategories: ["Urban"],
    gameplayStructure: "Paylines",
    features: ["Free Spins", "Multipliers"],
    volatility: "High",
    volatilityScore: 0.85,
    hitFrequency: "Low",
    featureDensity: "High",
    topWin: 10000,
    rtpRange: [96.41, 96.41],
    marketPresence: "Medium",
    targetMarkets: ["EU"]
  },

  /* ===== NOLIMIT CITY ===== */
  {
    name: "Mental",
    provider: "Nolimit City",
    releaseYear: 2021,
    themeCategories: ["Dark"],
    gameplayStructure: "Payways",
    features: ["Multipliers", "Bonus Buy"],
    volatility: "Very High",
    volatilityScore: 0.95,
    hitFrequency: "Low",
    featureDensity: "High",
    topWin: 66666,
    rtpRange: [96.08, 96.08],
    marketPresence: "Medium",
    targetMarkets: ["EU"]
  },
  {
    name: "Fire in the Hole",
    provider: "Nolimit City",
    releaseYear: 2022,
    themeCategories: ["Mining"],
    gameplayStructure: "Cluster Pays",
    features: ["Multipliers", "Bomb Mechanics"],
    volatility: "High",
    volatilityScore: 0.85,
    hitFrequency: "Medium",
    featureDensity: "High",
    topWin: 10000,
    rtpRange: [96.02, 96.02],
    marketPresence: "Medium",
    targetMarkets: ["EU"]
  },

  /* ===== RELAX GAMING ===== */
  {
    name: "Money Train 2",
    provider: "Relax Gaming",
    releaseYear: 2020,
    themeCategories: ["Steampunk"],
    gameplayStructure: "Paylines",
    features: ["Respins", "Multipliers"],
    volatility: "Very High",
    volatilityScore: 0.95,
    hitFrequency: "Low",
    featureDensity: "High",
    topWin: 50000,
    rtpRange: [96.4, 96.4],
    marketPresence: "High",
    targetMarkets: ["EU"]
  },
  {
    name: "Temple Tumble",
    provider: "Relax Gaming",
    releaseYear: 2020,
    themeCategories: ["Adventure"],
    gameplayStructure: "Cluster Pays",
    features: ["Cascades", "Free Spins"],
    volatility: "High",
    volatilityScore: 0.8,
    hitFrequency: "Medium",
    featureDensity: "High",
    topWin: 10000,
    rtpRange: [96.48, 96.48],
    marketPresence: "Medium",
    targetMarkets: ["EU"]
  },

  /* ===== QUICKSPIN ===== */
  {
    name: "Big Bad Wolf",
    provider: "Quickspin",
    releaseYear: 2015,
    themeCategories: ["Fairytale"],
    gameplayStructure: "Paylines",
    features: ["Free Spins", "Expanding Symbols"],
    volatility: "Medium",
    volatilityScore: 0.6,
    hitFrequency: "Medium",
    featureDensity: "Medium",
    topWin: 2500,
    rtpRange: [97.3, 97.3],
    marketPresence: "High",
    targetMarkets: ["EU"]
  },
  {
    name: "Dragon Shrine",
    provider: "Quickspin",
    releaseYear: 2018,
    themeCategories: ["Asian"],
    gameplayStructure: "Cluster Pays",
    features: ["Cascades", "Free Spins"],
    volatility: "Medium",
    volatilityScore: 0.6,
    hitFrequency: "Medium",
    featureDensity: "Medium",
    topWin: 3000,
    rtpRange: [96.09, 96.09],
    marketPresence: "Medium",
    targetMarkets: ["EU"]
  },

  /* ===== YGGDRASIL ===== */
  {
    name: "Vikings Go Berzerk",
    provider: "Yggdrasil",
    releaseYear: 2016,
    themeCategories: ["Vikings"],
    gameplayStructure: "Paylines",
    features: ["Free Spins", "Rage Mode"],
    volatility: "High",
    volatilityScore: 0.75,
    hitFrequency: "Medium",
    featureDensity: "Medium",
    topWin: 10000,
    rtpRange: [96.1, 96.1],
    marketPresence: "Medium",
    targetMarkets: ["EU"]
  },

  /* ===== RED TIGER ===== */
  {
    name: "Pirates Plenty",
    provider: "Red Tiger",
    releaseYear: 2019,
    themeCategories: ["Pirates"],
    gameplayStructure: "Paylines",
    features: ["Free Spins", "Jackpots"],
    volatility: "Medium",
    volatilityScore: 0.6,
    hitFrequency: "Medium",
    featureDensity: "Medium",
    topWin: 3000,
    rtpRange: [95.7, 95.7],
    marketPresence: "Medium",
    targetMarkets: ["EU"]
  },

  /* ===== BLUEPRINT ===== */
  {
    name: "Fishin Frenzy Megaways",
    provider: "Blueprint",
    releaseYear: 2020,
    themeCategories: ["Fishing"],
    gameplayStructure: "Megaways",
    features: ["Free Spins", "Multipliers"],
    volatility: "High",
    volatilityScore: 0.75,
    hitFrequency: "Medium",
    featureDensity: "Medium",
    topWin: 10000,
    rtpRange: [96.5, 96.5],
    marketPresence: "Medium",
    targetMarkets: ["EU"]
  },

  /* ===== ELK STUDIOS ===== */
  {
    name: "Nitropolis",
    provider: "ELK Studios",
    releaseYear: 2020,
    themeCategories: ["Urban"],
    gameplayStructure: "Cluster Pays",
    features: ["Multipliers", "Free Spins"],
    volatility: "High",
    volatilityScore: 0.8,
    hitFrequency: "Medium",
    featureDensity: "High",
    topWin: 10000,
    rtpRange: [96.2, 96.2],
    marketPresence: "Medium",
    targetMarkets: ["EU"]
  },

  /* ===== THUNDERKICK ===== */
  {
    name: "Pink Elephants",
    provider: "Thunderkick",
    releaseYear: 2017,
    themeCategories: ["Animals"],
    gameplayStructure: "Cluster Pays",
    features: ["Cascades", "Multipliers"],
    volatility: "Medium",
    volatilityScore: 0.6,
    hitFrequency: "High",
    featureDensity: "Medium",
    topWin: 3000,
    rtpRange: [96.6, 96.6],
    marketPresence: "Medium",
    targetMarkets: ["EU"]
  }
];

/**
 * Find similar games based on input criteria
 */
export function findSimilarGames(
  gameType: string,
  theme: string,
  volatility: string,
  features: string[],
  targetMarkets: string[],
  topN: number = 5
): Array<{ game: ReferenceGame; score: number; breakdown: Record<string, number> }> {
  const scored = referenceGamesLibrary.map((game) => {
    let score = 0;
    const breakdown: Record<string, number> = {};

    // Gameplay structure match (30 points)
    if (game.gameplayStructure.toLowerCase().includes(gameType.toLowerCase()) ||
        gameType.toLowerCase().includes(game.gameplayStructure.toLowerCase())) {
      score += 30;
      breakdown.gameplay = 30;
    } else {
      breakdown.gameplay = 0;
    }

    // Theme match (25 points)
    const themeMatch = game.themeCategories.some(t => 
      t.toLowerCase().includes(theme.toLowerCase()) || 
      theme.toLowerCase().includes(t.toLowerCase())
    );
    if (themeMatch) {
      score += 25;
      breakdown.theme = 25;
    } else {
      breakdown.theme = 0;
    }

    // Volatility match (20 points)
    if (game.volatility === volatility) {
      score += 20;
      breakdown.volatility = 20;
    } else {
      breakdown.volatility = 0;
    }

    // Feature overlap (15 points max)
    const featureOverlap = game.features.filter(f => 
      features.some(inputF => 
        f.toLowerCase().includes(inputF.toLowerCase()) || 
        inputF.toLowerCase().includes(f.toLowerCase())
      )
    ).length;
    const featureScore = Math.min(15, featureOverlap * 5);
    score += featureScore;
    breakdown.features = featureScore;

    // Market overlap (10 points max)
    const marketOverlap = game.targetMarkets.filter(m => 
      targetMarkets.some(inputM => 
        m.toLowerCase().includes(inputM.toLowerCase()) || 
        inputM.toLowerCase().includes(m.toLowerCase())
      )
    ).length;
    const marketScore = Math.min(10, marketOverlap * 5);
    score += marketScore;
    breakdown.market = marketScore;

    return { game, score, breakdown };
  });

  return scored
    .sort((a, b) => b.score - a.score)
    .slice(0, topN);
}

/**
 * Compute market saturation for a given game type and volatility
 */
export function computeMarketSaturation(
  gameType: string,
  volatility: string
): {
  totalSimilar: number;
  highPresenceCount: number;
  level: "Low" | "Medium" | "High" | "Very High";
  interpretation: string;
} {
  const similarGames = referenceGamesLibrary.filter(
    (g) =>
      g.gameplayStructure.toLowerCase().includes(gameType.toLowerCase()) &&
      g.volatility === volatility
  );

  const highPresence = similarGames.filter(
    (g) => g.marketPresence === "High"
  ).length;

  let level: "Low" | "Medium" | "High" | "Very High" = "Low";
  if (similarGames.length >= 8) level = "Very High";
  else if (similarGames.length >= 5) level = "High";
  else if (similarGames.length >= 3) level = "Medium";

  const interpretation =
    level === "Very High"
      ? `Market is extremely saturated with ${similarGames.length} similar titles. Differentiation is critical.`
      : level === "High"
      ? `Strong competition with ${similarGames.length} comparable games. Unique features recommended.`
      : level === "Medium"
      ? `Moderate competition with ${similarGames.length} similar games. Room for innovation.`
      : `Low competition. Opportunity for market entry with ${similarGames.length} comparable titles.`;

  return {
    totalSimilar: similarGames.length,
    highPresenceCount: highPresence,
    level,
    interpretation
  };
}

/**
 * Get benchmark data for competitive positioning
 */
export function getBenchmarkData(
  volatility: string
): {
  avgRtp: number;
  avgTopWin: number;
  avgFeatureDensity: number;
  count: number;
} {
  const games = referenceGamesLibrary.filter((g) => g.volatility === volatility);
  
  if (games.length === 0) {
    return { avgRtp: 96, avgTopWin: 5000, avgFeatureDensity: 0.5, count: 0 };
  }

  const avgRtp =
    games.reduce((sum, g) => sum + (g.rtpRange[0] + g.rtpRange[1]) / 2, 0) /
    games.length;
  
  const avgTopWin =
    games.reduce((sum, g) => sum + g.topWin, 0) / games.length;
  
  const densityMap: Record<string, number> = { Low: 0.3, Medium: 0.6, High: 0.9 };
  const avgFeatureDensity =
    games.reduce((sum, g) => sum + (densityMap[g.featureDensity] || 0.5), 0) /
    games.length;

  return {
    avgRtp: Math.round(avgRtp * 100) / 100,
    avgTopWin: Math.round(avgTopWin),
    avgFeatureDensity: Math.round(avgFeatureDensity * 100) / 100,
    count: games.length
  };
}

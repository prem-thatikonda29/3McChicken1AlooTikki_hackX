module.exports = {
  // ... other config
  theme: {
    extend: {
      animation: {
        "slow-spin": "spin 60s linear infinite",
        wave: "wave 15s linear infinite",
        "wave-slow": "wave 20s linear infinite",
      },
      keyframes: {
        wave: {
          "0%": { transform: "translateX(-50%)" },
          "100%": { transform: "translateX(0%)" },
        },
      },
    },
  },
};

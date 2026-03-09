"use strict";
// ============================================================
// KICLEPATRON — Point d'entrée du package game-engine
// ============================================================
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __exportStar = (this && this.__exportStar) || function(m, exports) {
    for (var p in m) if (p !== "default" && !Object.prototype.hasOwnProperty.call(exports, p)) __createBinding(exports, m, p);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.CARTES_COMMERCIAUX = exports.CARTES_EVENEMENTS = exports.CARTES_CLIENTS = exports.CARTES_DECISION = exports.ENTREPRISES = void 0;
__exportStar(require("./types"), exports);
__exportStar(require("./calculators"), exports);
__exportStar(require("./engine"), exports);
var entreprises_1 = require("./data/entreprises");
Object.defineProperty(exports, "ENTREPRISES", { enumerable: true, get: function () { return entreprises_1.ENTREPRISES; } });
var cartes_1 = require("./data/cartes");
Object.defineProperty(exports, "CARTES_DECISION", { enumerable: true, get: function () { return cartes_1.CARTES_DECISION; } });
Object.defineProperty(exports, "CARTES_CLIENTS", { enumerable: true, get: function () { return cartes_1.CARTES_CLIENTS; } });
Object.defineProperty(exports, "CARTES_EVENEMENTS", { enumerable: true, get: function () { return cartes_1.CARTES_EVENEMENTS; } });
Object.defineProperty(exports, "CARTES_COMMERCIAUX", { enumerable: true, get: function () { return cartes_1.CARTES_COMMERCIAUX; } });
//# sourceMappingURL=index.js.map
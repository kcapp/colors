var debug = require('debug')('kcapp-bot:bot');

exports.EASY = 1;
exports.MEDIUM = 2;
exports.HARD = 3;
exports.PERFECT = 4;

/** Array holding all values of the dart board in a circular order */
const BOARD = [20, 1, 18, 4, 13, 6, 10, 15, 2, 17, 3, 19, 7, 16, 8, 11, 14, 9, 12, 5];

/** Array holding multiplier values of the dart board in a circular order */
const BOARD_MULTIPLIERS = [1, 3, 1, 2];

/** Preferred checkouts for different numbers */
const CHECKOUT_GUIDE = {
    170: [{ score: 20, multiplier: 3 }, { score: 20, multiplier: 3 }, { score: 25, multiplier: 2 }],
    167: [{ score: 20, multiplier: 3 }, { score: 19, multiplier: 3 }, { score: 25, multiplier: 2 }],
    164: [{ score: 19, multiplier: 3 }, { score: 19, multiplier: 3 }, { score: 25, multiplier: 2 }],
    161: [{ score: 20, multiplier: 3 }, { score: 17, multiplier: 3 }, { score: 25, multiplier: 2 }],
    160: [{ score: 20, multiplier: 3 }, { score: 20, multiplier: 3 }, { score: 20, multiplier: 2 }],
    158: [{ score: 20, multiplier: 3 }, { score: 20, multiplier: 3 }, { score: 19, multiplier: 2 }],
    157: [{ score: 19, multiplier: 3 }, { score: 20, multiplier: 3 }, { score: 20, multiplier: 2 }],
    156: [{ score: 20, multiplier: 3 }, { score: 20, multiplier: 3 }, { score: 18, multiplier: 2 }],
    155: [{ score: 20, multiplier: 3 }, { score: 19, multiplier: 3 }, { score: 19, multiplier: 2 }],
    154: [{ score: 20, multiplier: 3 }, { score: 18, multiplier: 3 }, { score: 20, multiplier: 2 }],
    153: [{ score: 20, multiplier: 3 }, { score: 19, multiplier: 3 }, { score: 18, multiplier: 2 }],
    152: [{ score: 20, multiplier: 3 }, { score: 20, multiplier: 3 }, { score: 16, multiplier: 2 }],
    151: [{ score: 20, multiplier: 3 }, { score: 17, multiplier: 3 }, { score: 20, multiplier: 2 }],
    150: [{ score: 20, multiplier: 3 }, { score: 18, multiplier: 3 }, { score: 18, multiplier: 2 }],
    149: [{ score: 20, multiplier: 3 }, { score: 19, multiplier: 3 }, { score: 16, multiplier: 2 }],
    148: [{ score: 20, multiplier: 3 }, { score: 20, multiplier: 3 }, { score: 14, multiplier: 2 }],
    147: [{ score: 20, multiplier: 3 }, { score: 17, multiplier: 3 }, { score: 18, multiplier: 2 }],
    146: [{ score: 20, multiplier: 3 }, { score: 18, multiplier: 3 }, { score: 16, multiplier: 2 }],
    145: [{ score: 20, multiplier: 3 }, { score: 15, multiplier: 3 }, { score: 20, multiplier: 2 }],
    144: [{ score: 20, multiplier: 3 }, { score: 20, multiplier: 3 }, { score: 12, multiplier: 2 }],
    143: [{ score: 20, multiplier: 3 }, { score: 17, multiplier: 3 }, { score: 16, multiplier: 2 }],
    142: [{ score: 20, multiplier: 3 }, { score: 14, multiplier: 3 }, { score: 20, multiplier: 2 }],
    141: [{ score: 20, multiplier: 3 }, { score: 15, multiplier: 3 }, { score: 18, multiplier: 2 }],
    140: [{ score: 20, multiplier: 3 }, { score: 16, multiplier: 3 }, { score: 16, multiplier: 2 }],
    139: [{ score: 20, multiplier: 3 }, { score: 13, multiplier: 3 }, { score: 20, multiplier: 2 }],
    138: [{ score: 20, multiplier: 3 }, { score: 16, multiplier: 3 }, { score: 15, multiplier: 2 }],
    137: [{ score: 18, multiplier: 3 }, { score: 17, multiplier: 3 }, { score: 16, multiplier: 2 }],
    136: [{ score: 20, multiplier: 3 }, { score: 20, multiplier: 3 }, { score: 8, multiplier: 2 }],
    135: [{ score: 20, multiplier: 3 }, { score: 13, multiplier: 3 }, { score: 18, multiplier: 2 }],
    134: [{ score: 20, multiplier: 3 }, { score: 14, multiplier: 3 }, { score: 16, multiplier: 2 }],
    133: [{ score: 20, multiplier: 3 }, { score: 19, multiplier: 3 }, { score: 8, multiplier: 2 }],
    132: [{ score: 20, multiplier: 3 }, { score: 16, multiplier: 3 }, { score: 12, multiplier: 2 }],
    131: [{ score: 20, multiplier: 3 }, { score: 13, multiplier: 3 }, { score: 16, multiplier: 2 }],
    130: [{ score: 20, multiplier: 3 }, { score: 18, multiplier: 3 }, { score: 8, multiplier: 2 }],
    129: [{ score: 19, multiplier: 3 }, { score: 16, multiplier: 3 }, { score: 12, multiplier: 2 }],
    128: [{ score: 20, multiplier: 3 }, { score: 20, multiplier: 3 }, { score: 4, multiplier: 2 }],
    127: [{ score: 20, multiplier: 3 }, { score: 17, multiplier: 3 }, { score: 8, multiplier: 2 }],
    126: [{ score: 19, multiplier: 3 }, { score: 19, multiplier: 1 }, { score: 25, multiplier: 2 }],
    125: [{ score: 20, multiplier: 3 }, { score: 19, multiplier: 3 }, { score: 4, multiplier: 2 }],
    124: [{ score: 20, multiplier: 3 }, { score: 16, multiplier: 3 }, { score: 8, multiplier: 2 }],
    123: [{ score: 20, multiplier: 3 }, { score: 13, multiplier: 3 }, { score: 12, multiplier: 2 }],
    122: [{ score: 18, multiplier: 3 }, { score: 18, multiplier: 1 }, { score: 25, multiplier: 2 }],
    121: [{ score: 19, multiplier: 3 }, { score: 14, multiplier: 1 }, { score: 25, multiplier: 2 }],
    120: [{ score: 20, multiplier: 3 }, { score: 20, multiplier: 1 }, { score: 20, multiplier: 2 }],
    119: [{ score: 20, multiplier: 3 }, { score: 19, multiplier: 1 }, { score: 20, multiplier: 2 }],
    118: [{ score: 20, multiplier: 3 }, { score: 18, multiplier: 1 }, { score: 20, multiplier: 2 }],
    117: [{ score: 20, multiplier: 3 }, { score: 17, multiplier: 1 }, { score: 20, multiplier: 2 }],
    116: [{ score: 20, multiplier: 3 }, { score: 16, multiplier: 1 }, { score: 20, multiplier: 2 }],
    115: [{ score: 20, multiplier: 3 }, { score: 15, multiplier: 1 }, { score: 20, multiplier: 2 }],
    114: [{ score: 20, multiplier: 3 }, { score: 14, multiplier: 1 }, { score: 20, multiplier: 2 }],
    113: [{ score: 20, multiplier: 3 }, { score: 13, multiplier: 1 }, { score: 20, multiplier: 2 }],
    112: [{ score: 20, multiplier: 3 }, { score: 12, multiplier: 1 }, { score: 20, multiplier: 2 }],
    111: [{ score: 20, multiplier: 3 }, { score: 19, multiplier: 1 }, { score: 16, multiplier: 2 }],
    110: [{ score: 20, multiplier: 3 }, { score: 10, multiplier: 1 }, { score: 20, multiplier: 2 }],
    109: [{ score: 19, multiplier: 3 }, { score: 12, multiplier: 1 }, { score: 20, multiplier: 2 }],
    108: [{ score: 20, multiplier: 3 }, { score: 16, multiplier: 1 }, { score: 16, multiplier: 2 }],
    107: [{ score: 19, multiplier: 3 }, { score: 10, multiplier: 1 }, { score: 20, multiplier: 2 }],
    106: [{ score: 20, multiplier: 3 }, { score: 10, multiplier: 1 }, { score: 18, multiplier: 2 }],
    105: [{ score: 20, multiplier: 3 }, { score: 13, multiplier: 1 }, { score: 16, multiplier: 2 }],
    104: [{ score: 20, multiplier: 3 }, { score: 12, multiplier: 1 }, { score: 16, multiplier: 2 }],
    103: [{ score: 19, multiplier: 3 }, { score: 10, multiplier: 1 }, { score: 18, multiplier: 2 }],
    102: [{ score: 20, multiplier: 3 }, { score: 10, multiplier: 1 }, { score: 16, multiplier: 2 }],
    101: [{ score: 17, multiplier: 3 }, { score: 10, multiplier: 1 }, { score: 20, multiplier: 2 }],
    100: [{ score: 20, multiplier: 3 }, { score: 20, multiplier: 2 }],
    99: [{ score: 19, multiplier: 3 }, { score: 10, multiplier: 1 }, { score: 16, multiplier: 2 }],
    98: [{ score: 20, multiplier: 3 }, { score: 19, multiplier: 2 }],
    97: [{ score: 19, multiplier: 3 }, { score: 20, multiplier: 2 }],
    96: [{ score: 20, multiplier: 3 }, { score: 18, multiplier: 2 }],
    95: [{ score: 19, multiplier: 3 }, { score: 19, multiplier: 2 }],
    94: [{ score: 18, multiplier: 3 }, { score: 20, multiplier: 2 }],
    93: [{ score: 19, multiplier: 3 }, { score: 18, multiplier: 2 }],
    92: [{ score: 20, multiplier: 3 }, { score: 16, multiplier: 2 }],
    91: [{ score: 17, multiplier: 3 }, { score: 20, multiplier: 2 }],
    90: [{ score: 18, multiplier: 3 }, { score: 18, multiplier: 2 }],
    89: [{ score: 19, multiplier: 3 }, { score: 16, multiplier: 2 }],
    88: [{ score: 16, multiplier: 3 }, { score: 20, multiplier: 2 }],
    87: [{ score: 17, multiplier: 3 }, { score: 18, multiplier: 2 }],
    86: [{ score: 18, multiplier: 3 }, { score: 16, multiplier: 2 }],
    85: [{ score: 15, multiplier: 3 }, { score: 20, multiplier: 2 }],
    84: [{ score: 16, multiplier: 3 }, { score: 18, multiplier: 2 }],
    83: [{ score: 17, multiplier: 3 }, { score: 16, multiplier: 2 }],
    82: [{ score: 14, multiplier: 3 }, { score: 20, multiplier: 2 }],
    81: [{ score: 15, multiplier: 3 }, { score: 18, multiplier: 2 }],
    80: [{ score: 16, multiplier: 3 }, { score: 16, multiplier: 2 }],
    79: [{ score: 13, multiplier: 3 }, { score: 20, multiplier: 2 }],
    78: [{ score: 18, multiplier: 3 }, { score: 12, multiplier: 2 }],
    77: [{ score: 15, multiplier: 3 }, { score: 16, multiplier: 2 }],
    76: [{ score: 20, multiplier: 3 }, { score: 8, multiplier: 2 }],
    75: [{ score: 13, multiplier: 3 }, { score: 18, multiplier: 2 }],
    74: [{ score: 14, multiplier: 3 }, { score: 16, multiplier: 2 }],
    73: [{ score: 19, multiplier: 3 }, { score: 8, multiplier: 2 }],
    72: [{ score: 16, multiplier: 3 }, { score: 12, multiplier: 2 }],
    71: [{ score: 13, multiplier: 3 }, { score: 16, multiplier: 2 }],
    70: [{ score: 18, multiplier: 3 }, { score: 8, multiplier: 2 }],
    69: [{ score: 19, multiplier: 1 }, { score: 25, multiplier: 2 }],
    68: [{ score: 20, multiplier: 3 }, { score: 4, multiplier: 2 }],
    67: [{ score: 17, multiplier: 3 }, { score: 8, multiplier: 2 }],
    66: [{ score: 10, multiplier: 3 }, { score: 18, multiplier: 2 }],
    65: [{ score: 19, multiplier: 3 }, { score: 4, multiplier: 2 }],
    64: [{ score: 16, multiplier: 3 }, { score: 8, multiplier: 2 }],
    63: [{ score: 13, multiplier: 3 }, { score: 12, multiplier: 2 }],
    62: [{ score: 10, multiplier: 3 }, { score: 16, multiplier: 2 }],
    61: [{ score: 15, multiplier: 3 }, { score: 8, multiplier: 2 }],
    60: [{ score: 20, multiplier: 1 }, { score: 20, multiplier: 2 }],
    59: [{ score: 19, multiplier: 1 }, { score: 20, multiplier: 2 }],
    58: [{ score: 18, multiplier: 1 }, { score: 20, multiplier: 2 }],
    57: [{ score: 17, multiplier: 1 }, { score: 20, multiplier: 2 }],
    56: [{ score: 16, multiplier: 1 }, { score: 20, multiplier: 2 }],
    55: [{ score: 15, multiplier: 1 }, { score: 20, multiplier: 2 }],
    54: [{ score: 14, multiplier: 1 }, { score: 20, multiplier: 2 }],
    53: [{ score: 13, multiplier: 1 }, { score: 20, multiplier: 2 }],
    52: [{ score: 12, multiplier: 1 }, { score: 20, multiplier: 2 }],
    51: [{ score: 19, multiplier: 1 }, { score: 16, multiplier: 2 }],
    50: [{ score: 10, multiplier: 1 }, { score: 20, multiplier: 2 }],
    49: [{ score: 17, multiplier: 1 }, { score: 16, multiplier: 2 }],
    48: [{ score: 16, multiplier: 1 }, { score: 16, multiplier: 2 }],
    47: [{ score: 15, multiplier: 1 }, { score: 16, multiplier: 2 }],
    46: [{ score: 6, multiplier: 1 }, { score: 20, multiplier: 2 }],
    45: [{ score: 13, multiplier: 1 }, { score: 16, multiplier: 2 }],
    44: [{ score: 12, multiplier: 1 }, { score: 16, multiplier: 2 }],
    43: [{ score: 3, multiplier: 1 }, { score: 20, multiplier: 2 }],
    42: [{ score: 10, multiplier: 1 }, { score: 16, multiplier: 2 }],
    41: [{ score: 9, multiplier: 1 }, { score: 16, multiplier: 2 }]
}

/**
 * Generate a list of probabilities. This will use the value for each key in the object,
 * to add that many elements to the generated list
 *
 * @param {object} probabilities
 */
function generateProbabiltyList(probabilities) {
    var all = [];
    probabilities.forEach(function (obj, index) {
        for (var key in obj) {
            for (var i = 0; i < obj[key]; i++) {
                all.push(key)
            }
        }
    });
    return all;
}

/**
 * Get a random value from the given array
 * @param {array} list - List of values
 */
function getRandom(list) {
    return parseInt(list[Math.floor(Math.random() * list.length)]);
}

/**
 * Get adjecent elements from the list of the given idx
 * @param {array} list - List of get adjecent elements from
 * @param {int} idx - Index of element to get adjecent of
 * @param {int} number - Number of adjecent elements to get
 */
function getAdjacent(list, idx, number) {
    var newList = [];

    for (var i = 1; i <= number; i++) {
        if (idx - i < 0) {
            newList.push(list[list.length + idx - i]);
        } else {
            newList.push(list[idx - i]);
        }
        if (idx + i >= list.length) {
            newList.push(list[list.length - idx - i]);
        } else {
            newList.push(list[idx + i]);
        }
    }
    return newList;
}

function isSuccessful(targetPercentage) {
    return Math.random() < targetPercentage;
}

/**
 * Attempt a throw at the given number
 *
 * @param {int} number - Number we are aiming for
 */
exports.attemptThrow = (number, multiplier) => {
    this.dartsThrown++;
    var hit = isSuccessful(this.hitrate);
    if (hit) {
        return { score: number, multiplier: multiplier };
    } else {
        // We missed, so determine what we hit
        var score
        if (number === 25) {
            // Going for bull, pick a random number
            score = getRandom(BOARD);
            multiplier = 1;
        } else {
            score = getRandom(getAdjacent(BOARD, BOARD.indexOf(number), this.missRange));
            multiplier = getRandom(getAdjacent(BOARD_MULTIPLIERS, BOARD_MULTIPLIERS.indexOf(multiplier), 1));
        }
        return { score: score, multiplier: multiplier };
    }

}

exports.attemptCheckout = (currentScore, thrown) => {
    var darts = [];
    if (currentScore > 40) {
        var checkout = CHECKOUT_GUIDE[currentScore];
        if (thrown > checkout.length) {
            debug("Trying for a big checkout: " + currentScore);
            // Lets attempt the checkout
            for (var i = thrown; i < 3; i++) {
                var dart = this.attemptThrow(checkout[i].score, checkout[i].multiplier);
                darts.push(dart);
                currentScore -= dart.score * dart.multiplier;
                if (currentScore <= 0) {
                    break;
                }
            }
        } else {
            debug("We don't have enough darts, just score");
            // We cannot complete the perfect checkout, so lets just score some points
            // TODO improve
            for (var i = thrown; i < 3; i++) {
                var dart = this.attemptThrow(20, 1);
                darts.push(dart);
                currentScore -= dart.score * dart.multiplier;
                if (currentScore <= 1) {
                    break;
                }
            }
        }
    } else {
        // TODO Only attempt checkout if we have an even number
        debug(`Score is ${currentScore}, trying to checkout`);
        for (var i = thrown; i < 3; i++) {
            var dart = this.attemptThrow(currentScore / 2, 2);
            darts.push(dart);
            currentScore -= dart.score * dart.multiplier;
            if (currentScore <= 0) {
                break;
            }
        }
    }
    return darts;
}

exports.getScore = () => {
    return getRandom(this.scores);
}
exports.getMultipler = () => {
    return getRandom(this.multipliers);
}

exports.getDart = () => {
    return { score: this.getScore(), multiplier: this.getMultipler() };
}

exports.new = (skill) => {
    var scores = [];
    var multipliers = [];
    var checkout = 1.0; // How good are we at checking out?
    var hitrate = 0.50; // How good are we at hitting?
    // var multiplierHitrate = 0.30;
    var missRange = 1; // When we miss how far do we miss?
    switch (skill) {
        case this.MEDIUM:
            scores = generateProbabiltyList([{ 12: 50 }, { 5: 300 }, { 20: 500 }, { 1: 250 }, { 18: 50 }]);
            multipliers = generateProbabiltyList([{ 1: 700 }, { 2: 100 }, { 3: 200 }]);
            checkout = 0.20;
            hitrate = 0.30;
            missRange = 2;
            break;
        case this.HARD:
            scores = generateProbabiltyList([{ 5: 50 }, { 20: 900 }, { 1: 50 }]);
            multipliers = generateProbabiltyList([{ 1: 500 }, { 2: 50 }, { 3: 450 }]);
            checkout = 0.80;
            hitrate = 0.80;
            missRange = 1;
            break;
        case this.PERFECT:
            scores = generateProbabiltyList([{ 20: 900 }]);
            multipliers = generateProbabiltyList([{ 3: 1000 }]);
            checkout = 1.0;
            hitrate = 1.0;
            missRange = 1;
            break;
        case this.EASY:
        default:
            scores = generateProbabiltyList([{ 9: 10 }, { 12: 80 }, { 5: 360 }, { 20: 160 }, { 1: 300 }, { 18: 80 }, { 4: 10 }]);
            multipliers = generateProbabiltyList([{ 1: 900 }, { 2: 50 }, { 3: 50 }]);
            checkout = 0.10;
            hitrate = 0.10;
            missRange = 3;
            break;
    }
    this.scores = scores;
    this.multipliers = multipliers;
    this.checkout = checkout;
    this.hitrate = hitrate;
    this.missRange = missRange;
}

module.exports = (id) => {
    this.id = id;
    this.dartsThrown = 0;
    return this;
}

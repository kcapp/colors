exports.EASY = 1;
exports.MEDIUM = 2;
exports.HARD = 3;

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

function getRandom(list) {
    return parseInt(list[Math.floor(Math.random() * list.length)]);
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

exports.attemptCheckout = (currentScore) => {
    var checkout = Math.random();
    if (checkout < this.checkout) {
        return { score: currentScore / 2, multiplier: 2 };
    } else {
        return { score: 0, multiplier: 1 };
    }
}

exports.new = (skill) => {
    var scores = [];
    var multipliers = [];
    var checkout = 1;
    switch (skill) {
        case this.MEDIUM:
            scores = generateProbabiltyList([{ 12: 50 }, { 5: 300 }, { 20: 500 }, { 1: 250 }, { 18: 50 }]);
            multipliers = generateProbabiltyList([{ 1: 700 }, { 2: 100 }, { 3: 200 }]);
            checkout = 0.20;
            break;
        case this.HARD:
            scores = generateProbabiltyList([{ 5: 50 }, { 20: 900 }, { 1: 50 }]);
            multipliers = generateProbabiltyList([{ 1: 500 }, { 2: 50 }, { 3: 450 }]);
            checkout = 0.80;
            break;
        case this.EASY:
        default:
            scores = generateProbabiltyList([{ 9: 10 }, { 12: 80 }, { 5: 360 }, { 20: 160 }, { 1: 300 }, { 18: 80 }, { 4: 10 }]);
            multipliers = generateProbabiltyList([{ 1: 900 }, { 2: 50 }, { 3: 50 }]);
            checkout = 0.10;
            break;
    }
    this.scores = scores;
    this.multipliers = multipliers;
    this.checkout = checkout;
}

module.exports = (id) => {
    this.id = id;
    return this;
}
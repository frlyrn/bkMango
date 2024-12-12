const tf = require('@tensorflow/tfjs-node');
const inputError = require('../exceptions/inputError');

async function predictClassification(model, image) {
    try {
        const tensor = tf.node
            .decodeJpeg(image)
            .resizeNearestNeighbor([224, 224])
            .expandDims()
            .toFloat();

        const prediction = model.predict(tensor);
        const scores = await prediction.data()
        const label = scores[0] > 0.5 ? "Mature" : "Immature";

        let suggestion;

        if (label === 'Mature') {
            suggestion = "The mango is ripe, ready to eat.";
        } else if (label === 'Immature') {
            suggestion = "The mango is not ripe, wait a few more days.";
        }

        return { label, suggestion };
    } catch (error) {
        throw new inputError('There was an error in making predictions.');
    }

}

module.exports = predictClassification;

const findEstimatedTime = (fileSize) => {
    const bytesEstimated = 27;
    const estimatedTime = fileSize/bytesEstimated;

    const minutes = Math.floor(estimatedTime/60000);
    const seconds = ((fileSize % 60000) / 1000).toFixed(0);

    return {
        minutes,
        seconds,
        total: estimatedTime
    }
}

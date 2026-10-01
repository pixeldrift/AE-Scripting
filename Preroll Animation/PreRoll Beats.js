	// Find the nearest next marker.
	let markerIndex = 1;
	while (markerIndex <= thisLayer.marker.numKeys && thisLayer.marker.key(markerIndex).time <= time) {
		markerIndex++;
	}

	// Check if there are any markers ahead.
	if (markerIndex <= thisLayer.marker.numKeys) {

		// If we haven't reached the preroll time of the next marker yet,
		// continue using the previous marker even though we've passed it.
		if (time < markerTime - preRoll) {
			markerIndex--;
		}

		// If their is a marker and it has a comment, check if the comment
		// is a number and use that number for which beat to play
		let markerComment = thisLayer.marker.key(markerIndex).comment;
		if (!isNaN(parseFloat(markerComment))) {
			beatCount = parseFloat(markerComment);
		}

		// Calculate the time remap value. Since we set the beatCount to be
		// in seconds, we can just add it to jump to that beat of the animation.
		beatCount + currentTime - markerTime;

		// Reset the animation after it has played for one second minus the preroll.
		// This is so we don't continue beyond into the next beat of the precomp.
		// This should be the duration of the beat rather than a hardcoded time value.
		if (time - markerTime > 1 - preRoll) {
			timeRemapValue = 0;
		}

		timeRemapValue;
	} else {
		// If there are no more markers ahead, keep the layer frozen at frame 0
		0;
	}
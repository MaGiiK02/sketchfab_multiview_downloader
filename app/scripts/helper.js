/**
 * Geometry helpers
 */

function calculateRotateAround(pivot, axis, radii, vector){
    /**
     * Rotate arround using the move to the rotation center trick
     * (move point to the center rotate to face the new forward direction
     * and then bring it back to the orbit)
     */

    const rotationOrigin = vec3.create();
    vec3.subtract(rotationOrigin, vector, pivot);
    
    const rotationMatrix = mat4.create();
    const outVector = vec3.create();
    mat4.fromRotation(rotationMatrix, radii, axis);
    vec3.transformMat4(outVector, rotationOrigin, rotationMatrix);

    const newPosition = vec3.create();
    vec3.add(newPosition, outVector, pivot);

    return newPosition;
}

function rotateArround(api, rotation, cb){
    api.getCameraLookAt(function(err, camera) {
                
        const [radii, ...axis] = getRotation(rotation);
        const new_pos = calculateRotateAround(
            camera.target, axis, radii, camera.position);

        const cameraOldPos = camera.position.slice();
        const cameraOldTarget = camera.target.slice();
        
        api.setCameraLookAt(
            new_pos, // eye position
            camera.target, // target to lookat
            0, // duration of the animation in seconds);
            () => cb(cameraOldPos, cameraOldTarget) //callback after the rotation
        );

    });
}

/**
 * Geometry helpers End
 */
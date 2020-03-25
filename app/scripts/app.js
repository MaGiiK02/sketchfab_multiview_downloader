'use strict';

//App settings start

//Rotation -> [angle(radii), horizontal(x), depth(z), vertical(y)]
//if rotation == null -> screenshot without futer rotation
const shotDescriptors = [
    {
        "prefix": "F",
        "baseRotation": null,
        "rotations" : [
            null, 
            [Math.PI/4,      1, 0, 1], //topRight
            [Math.PI/2,      1, 0, 1], //topRight
            [Math.PI/18,      1, 0, 1], //topRight
            [-Math.PI/18,     1, 0, 1], //topRight
            [-Math.PI/4,     1, 0, 1], //topRight
            [-Math.PI/2,     1, 0, 1], //topRight
        
            [Math.PI/4,      -1, 0, 1], //topLeft
            [Math.PI/2,      -1, 0, 1], //topLeft
            [Math.PI/18,      -1, 0, 1], //topLeft
            [-Math.PI/18,     -1, 0, 1], //topLeft
            [-Math.PI/4,     -1, 0, 1], //topLeft
            [-Math.PI/2,     -1, 0, 1], //topLeft
        
            [Math.PI/4,     0, 0, 1], // top
            [Math.PI/2,     0, 0, 1], // top
            [Math.PI/18,     0, 0, 1], // top
            [-Math.PI/18,    0, 0, 1], // top
            [-Math.PI/2,    0, 0, 1], // top
            [-Math.PI/4,    0, 0, 1], // top
        
            [Math.PI/4,      1, 0, 0], //horizontal(right)
            [Math.PI/2,      1, 0, 0], //horizontal(right)
            [Math.PI/18,      1, 0, 0], //horizontal(right)
            [-Math.PI/18,     1, 0, 0], //horizontal(right)
            [-Math.PI/4,     1, 0, 0], //horizontal(right)
            [-Math.PI/2,     1, 0, 0], //horizontal(right)
        ]
    },{
        "prefix": "B",
        "baseRotation": [Math.PI, 0, 0, 1],
        "rotations" : [
            null,
            [Math.PI/4,      1, 0, 1], //topRight
            [Math.PI/2,      1, 0, 1], //topRight
            [Math.PI/18,      1, 0, 1], //topRight
            [-Math.PI/18,     1, 0, 1], //topRight
            [-Math.PI/4,     1, 0, 1], //topRight
            [-Math.PI/2,     1, 0, 1], //topRight

            [Math.PI/4,      -1, 0, 1], //topLeft
            [Math.PI/2,      -1, 0, 1], //topLeft
            [Math.PI/18,      -1, 0, 1], //topLeft
            [-Math.PI/18,     -1, 0, 1], //topLeft
            [-Math.PI/4,     -1, 0, 1], //topLeft
            [-Math.PI/2,     -1, 0, 1], //topLeft

            [Math.PI/18,     0, 0, 1], // top
            [Math.PI/4,     0, 0, 1], // top
            //[Math.PI/2,     0, 0, 1], // top
            //[-Math.PI/2,    0, 0, 1], // top
            [-Math.PI/4,    0, 0, 1], // top
            [-Math.PI/18,    0, 0, 1], // top

            [Math.PI/4,      1, 0, 0], //horizontal(right)
            [Math.PI/18,      1, 0, 0], //horizontal(right)
            [-Math.PI/18,     1, 0, 0], //horizontal(right)
            [-Math.PI/4,     1, 0, 0], //horizontal(right)
        ]
    },
];
    

const screenshotWaitTimeMs = 2000;

const screenshotSettings = {
    "width" : 1024, 
    "height" : 1024,
    "mime_type" : "image/jpeg" 
};

const uploadUrl = "http://localhost:8080";
const sketchFabUrl = 'https://api.sketchfab.com/v3';

const maxModelReleaseDate = moment().subtract("3 months");

// App Setting End

const iframe = document.getElementById( 'api-frame' );
const version = '1.7.0';
var invalidUids = [];

function process(uids, promise){

    promise.then(() => {
        if(uids.length <= 0) return;
        const [uid, ...rest] = uids;
        console.log(uid);
        const innerPromise = new Promise((resolve) => {
            try {
                generateViews(uid, resolve);
            }catch (error) {
                console.error(error);
                invalidUids.push(uid);
                console.log(invalidUids);
                resolve();
            }
        });
        process(rest, innerPromise);

    });
}

function generateViews(uid, cb){
    const data  = generateData(uid);
    if(!data) {
        cb();
        return;
    }

    sendData(data, () => {
        renderScreenShots(uid, cb);
    });
}



function generateData(uidObj){
    var url = sketchFabUrl.concat('/models/'.concat(uidObj));

    var xmlHttp = new XMLHttpRequest();
    xmlHttp.open( "GET", url, false ); 
    xmlHttp.send();
    var response = JSON.parse(xmlHttp.responseText);

    //if( !response.isDownloadable ) return null;
    //if( response.isProtected ) return null;
    //if( response.price ) return null;
    if( response.animationCount > 0 ) return null;
    if( response.soundCount > 0 ) return null;

    var published_at = moment(response.publishedAt).utc();
    var lifetime_seconds = moment().utc().diff(published_at);
    return {
        "uid" : response.uid,
        "viewCount" : response.viewCount,
        "likeCount" : response.likeCount,
        "commentCount" : response.commentCount,
        "vertexCount" : response.vertexCount,
        "faceCount" : response.faceCount,
        "analizedAt" : moment().utc().format("YYYY-MM-DDThh:mm:ss"),
        "publishedAt" : published_at.format("YYYY-MM-DDThh:mm:ss"),
        "lifetimeSeconds": lifetime_seconds,
        "category": response.categories[0].name
    }

}

function renderScreenShots(uidObj, callback){
    const viewer = new Sketchfab( version, iframe );
    viewer.init( uidObj, {
        success: function onSuccess( api ){
            api.load()
            api.start();
            api.addEventListener( 'viewerready', function() {
                //viewer's API is ready to use 
                getScreenShots(
                    shotDescriptors, 
                    api,
                    uidObj,
                    new Promise((r)=>r()), 
                    callback
                );      
            
            });
        },
        error: function onError() {
            console.log( 'Viewer error' );
            invalidUids.push(uidObj);
            callback();
        },
        camera: 0,
		preload: 1
    });
}


function getScreenShots(
    shotDescriptors, api, uidCurrent, promise, callback
) {
    /**
     * Go throught the rotationDescriptor generating the rotation matrix 
     * relative to the base rotation with the requested screenshots 
     * of the first description doing this for each description
     */

    promise.then(() => { 
        if(shotDescriptors.length <=0) {
            callback();
            return;
        }

        const [descriptor, ...rest] = shotDescriptors;

        const innerPromise = new Promise((resolve) => {
            rotateArround(api, descriptor['baseRotation'], 
            (oldCameraPos, oldTarget) => {

                getScreenShotsByList(
                    descriptor['rotations'],  //the list of the rotation to take for this descriptor
                    descriptor['prefix'],     //the prefix of the file name
                    api,                      //api handle
                    uidCurrent,               //current model uid
                    new Promise((r)=>r()),    //a dummy promise where to attach new one
                    ()=>{
                        //the callback of the promise called to continue with the next one
                        api.setCameraLookAt(oldCameraPos, oldTarget, 0, resolve);
                    }                  
                );
            });  
        });   

        //recusion (append to the created promise a new promise after it ended)
        getScreenShots( 
             rest, api, uidCurrent, innerPromise, callback);
    });
}


function getScreenShotsByList(
    rotations, prefix, api, uidCurrent, promise, callback
) {

    promise.then(() => {
        if(rotations.length <= 0) {
            if(callback) callback();
            return;
        }
    
        const [rotation, ...rest] = rotations;

        const rotationOperation = rotateAndShot(
            uidCurrent, api, prefix, rotation);

        const innerPromise = new Promise(rotationOperation);

        getScreenShotsByList( //recusion
            rest, prefix, api, uidCurrent, innerPromise, callback)
    });
    
}

/// da mettere a posto i parametri2!!!!!
function rotateAndShot(uidc, api, prefix, rotation){
    const rotation_setting = {duration: 0};
    const clojure = (resolve, reject) => {
        rotateArround(api, rotation, 
        (oldCameraPos, oldTarget) => {
            setTimeout( () => {
                getScreenShot(api, (image) => {
                    const name = prefix + "_" + rotationToString(rotation);
                    sendImage(uidc, name, image);
                    api.setCameraLookAt(oldCameraPos, oldTarget, 0, resolve);
                });
            }, screenshotWaitTimeMs);
        });
    };

    return clojure;
}

function getRotation(rotation){
    if( !rotation ) return [0, 1, 0, 0];
    else return rotation;
}


function getScreenShot(api, cb){
    return new Promise( (resolve, reject) => {
            api.getScreenShot(
                screenshotSettings["width"], 
                screenshotSettings["height"], 
                screenshotSettings["mime_type"], 
                function(err, result) {
                    resolve();
                    if(err) return;
                    cb(result);
                }
            )
        }
    );
}

function sendData( data, callback ) {
    var formData = new FormData();

    Object.keys(data).forEach((key) => {
        formData.append(key,data[key]);
    });

    var request = new XMLHttpRequest();
    request.open("POST", uploadUrl);
    request.onreadystatechange = (()=>{
        if(request.readyState === XMLHttpRequest.DONE && request.status === 200) {
            if(callback)callback();
        }
    });
    request.send(formData);
    console.log("sended:", request);
}

function sendImage(uid, name, image, callback ) {
    var formData = new FormData();

    formData.append('view', image);
    formData.append('name', name);

    var request = new XMLHttpRequest();
    request.open("POST", uploadUrl.concat('/').concat(uid));
    request.onreadystatechange = ( ()=>{
        if(request.readyState === XMLHttpRequest.DONE && request.status === 200) {
          if(callback)callback();
        }
    });
    request.send(formData);
}

const angleVerticalNames = {
    "0" : "",
    "1" : "top",
    "-1": "bottom"
};
const angleHorizontalNames = {
    "0" : "",
    "1" : "right", // to check
    "-1": "left" // to check
};
const angleDepthNames = {
    "0" : "",
    "1" : "facing",
    "-1": "not_facing"
};

function rotationToString(rotation){
    if (!rotation) return "";
    
    const angleGrad = Math.round(rotation[0]*57.2957795131);
    if(angleGrad == 0) return "0";

    const vertical = angleVerticalNames[rotation[3]];
    const horizontal = angleHorizontalNames[rotation[1]];
    const depth = angleDepthNames[rotation[2]];

    return [vertical, horizontal, depth, angleGrad].join("_");
}

//Start Processing!!!
process(toRenderList, new Promise( (r)=>r() ));
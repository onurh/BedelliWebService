var express = require('express');
var router = express.Router();

// Firebase Admin
var admin = require("firebase-admin");
var serviceAccount = require("../config/bedelliplatform-firebase.json");

admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    databaseURL: "https://bedelliplatform.firebaseio.com/"
});

// Middleware - Header Interceptor
router.use(function (req, res, next) {
    var token = req.header("x-auth-firebase") !== undefined ? req.header("x-auth-firebase") : "";
    admin.auth().verifyIdToken(token).then(function (decodedToken) {
        res.locals.decodedToken = decodedToken;

        next()
    }).catch(function (error) {
        console.log(error);

        // For Fallback
        admin.auth().getUser("[TEST UID]").then(function (userRecord) {
            res.locals.decodedToken = userRecord;

            next();
        });
    });
});

// API Samples
router.get('/', function (req, res, next) {
    var decodedToken = res.locals.decodedToken;

    var ref = admin.database().ref("test");
    ref.child(decodedToken.uid).once("value", function (snapshot) {
        res.send(snapshot.val());
    }, function (errorObject) {
        next(errorObject)
    });
});

router.put('/', function (req, res, next) {
    var decodedToken = res.locals.decodedToken;

    var ref = admin.database().ref("test");
    ref.child(decodedToken.uid).set(true).then(function (error) {
        if (error) next(error);
        else res.send("OK");
    })
});

router.delete('/', function (req, res, next) {
    var decodedToken = res.locals.decodedToken;

    var ref = admin.database().ref("test");
    ref.child(decodedToken.uid).delete().then(function (error) {
        if (error) next(error);
        else res.send("OK");
    })
});

// MiddleWare - Exception Handler
router.use(function (err, req, res, next) {
    res.status(500).json({
        result: "fail",
        error: err.message
    });
});

module.exports = router;
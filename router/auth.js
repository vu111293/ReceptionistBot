module.exports = function (app) {
    // app.get('/', function (req, res) {
    //     res.render('index.html')
    // });

    // app.get('/about', function (req, res) {
    //     res.render('about.html');
    // });

    app.get('/auth/redirect', function (request, res) {
        let code = mStorage.authCode(request.query.code);
        request.get('https://slack.com/api/oauth.access?client_id=26587670230.340601737508&client_secret=7e3cc79f289771b5ee8ae1cb0448be6a&code=' + code,
            function (error, reponse, body) {
                console.log('error:', error); // Print the error if one occurred
                // console.log('statusCode:', response && response.statusCode); // Print the response status code if a response was received
                console.log('body:', body); // Print the HTML for the Google homepage.
                res.status(200).send('Success');
            });
    });
}
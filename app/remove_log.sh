sed -i 's/^.*log/\/\/log/g' ./models/*.js ./models/handlers/*.js
git checkout ./models/tada-request.js 
git checkout ./models/delay-checker.js
git checkout ./models/prerequest.js

# SkiGroupProject2023

Application Description:
Karv is an all-in-one ski marketplace software that guides users to discover their new life within skiing, with both shopping and planning functionalities. Users can create an account where they can then look at and purchase different types of ski equipment. They can look at different ski resorts, planning and logging their trips. They can view all of their past purchases and trips on the profile page, as well as change their account information.

Contributors:
Jack Savio
Conrad Barron
Andrew Lan
Parker Allen
Luke Gosnell
Xan Gardner

Technology Stack:
Database: PostegreSQL, Google API
Back-end: NodeJS, JavaScript
Front-end: HTML, CSS, EJS, JavasScript, Bootstrap
Infrastructure: Docker, Microsoft Azure
Services: GitHub

Prerequisites:
Git
Docker Desktop
VSCode

Instructions:
Steps to run the application locally
1. Navigate to the directory where you want to store the local repository
2. Run 'git clone' to clone the repository to your local machine
3. Navigate to the 'SkiGroupProject2023' folder ('cd .\SkiGroupProject2023\')
4. Navigate to the 'Code' folder ('cd .\Code\')
5. Run 'docker compose up'
6. Type 'http://localhost:3000/' in your browser to navigate to the website
7. When done, type 'docker compose down -v' to shut down the container

Testing:
1. Go to the 'docker-compose.yaml' file
2. Comment out the section above the '#For testing/lab 11'
3. Uncomment the section below the 'For testing/lab 11'
4. Navigate to the 'index.js' file
5. Go to the 'app.post('/login')' API
6. Comment out all of the 'res.redirect()' statements
7. Uncomment out the 'res.json()' statements
8. Go to the 'app.post('/register')' API
9. Comment out all of the 'res.redirect()' statements
10. Uncomment out the 'res.json()' statements
11. Run 'docker compose down -v' to shut down any running containers
12. Run 'docker compose up'
13. Test cases will run and display in the terminal
14. When done, run 'docker compose down -v' to shut down the container

Deployed Application:
http://recitation-012-team-1.eastus.cloudapp.azure.com:3000/home 
Or for local deployment
http://localhost:3000/
rsync -r src/ docs/
rsync build/contracts/* docs/
git add .
git commit -m "Compiles assets for Github Pages"
git remote add origin https://github.com/ishtiaqmahmood/ishtiaqmahmood.github.io.git
git push -u origin master

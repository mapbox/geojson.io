branch=$(git symbolic-ref --short HEAD)

git checkout --orphan deploy

npm install
npm run build

# include /dist in the commit
rm -rf .gitignore
echo "/node_modules\n.DS_Store" > .gitignore

git add -A  # Add all files and commit them
git commit -m "deploy"

git branch -D gh-pages  # Deletes the gh-pages branch
git branch -m gh-pages  # Rename the current branch to gh-pages
git push -f origin gh-pages  # Force push gh-pages branch to github
git checkout $branch

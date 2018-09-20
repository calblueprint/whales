#!/usr/bin/env bash

which -s brew
if [[ $? != 0 ]] ; then
  echo "You don't already have Homebrew. We're installing it now..."
  ruby -e "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/master/install)"
fi
echo "Updating Homebrew..."
brew update

which -s docker
if [[ $? != 0 ]] ; then
  echo "Installing Docker Toolbox..."
  brew cask install docker-toolbox
fi

echo "Installing expect..."
brew install expect

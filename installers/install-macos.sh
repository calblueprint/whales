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
  echo "Installing Docker.app..."
  brew cask install docker
fi

echo "Launching Docker.app... once this opens, you don't have to login or signup."
open -a /Applications/Docker.app
echo "Installing expect..."
brew install expect

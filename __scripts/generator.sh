#!/bin/zsh

cd $(dirname "$0")

BASE=../
STORAGE=$BASE/__scripts/tmp

source $HOME/.zshrc # to rely on 1Password CLI for authentication to Cloudflare
source $BASE/.env # to get Cloudflare account and project info for deployment

LOCAL=$BASE/build
PATH=$SSG_PATH_HACK
REMOTE=$SSG_REMOTE
WORKINGFILE=$STORAGE/working-ssg.log
COMPLETEDFILE=$STORAGE/completed-ssg.log
NOW=$(/bin/date +%s)

if [ ! -d $STORAGE ]
then
    mkdir -p $STORAGE
fi

if [ -e $WORKINGFILE ]
then
    echo Already Processing
    exit
fi

echo $NOW started
echo $NOW > $WORKINGFILE

echo "\n---\yarn run build\n---\n" >> $WORKINGFILE
nvm use >> $WORKINGFILE 2>&1
yarn run build >> $WORKINGFILE 2>&1

if [[ -n $CLOUDFLARE_ACCOUNT_ID ]] && [[ -n $CLOUDFLARE_WRANGLER_PROJECT ]]
then
    export CLOUDFLARE_ACCOUNT_ID=$CLOUDFLARE_ACCOUNT_ID
    if [[ -n $CLOUDFLARE_API_TOKEN ]]
    then
        export CLOUDFLARE_API_TOKEN=$CLOUDFLARE_API_TOKEN
    fi
    echo "\n---\nwrangler pages deploy $LOCAL --project-name $CLOUDFLARE_WRANGLER_PROJECT\n---\n" >> $WORKINGFILE
    wrangler pages deploy $LOCAL --project-name $CLOUDFLARE_WRANGLER_PROJECT >> $WORKINGFILE 2>&1
fi

COMPLETED=$(/bin/date +%s)

echo $COMPLETED > $COMPLETEDFILE
cat $WORKINGFILE >> $COMPLETEDFILE
rm $WORKINGFILE

echo $COMPLETED completed

import tweets from './tweets.json' assert { type: 'json' }

const createDOMTemplate = (tweet, index) => {
  const { 
    user_icon,
    user_name,
    user_id,
    tweet_text,
    tweet_img,
    time,
    date,
    number_rt,
    number_fav
  } = tweet

  return `<div id='twitter_${index}' class='container'><div class='header'><div class='user'><div class='user_icon'><img src='${user_icon}' alt=''></div><div class='user_profile'><div contenteditable='true' class='user_name'>${user_name}</div><div contenteditable='true' class='user_id'>${user_id}</div></div></div><div class='reader'>…</div></div><div class='tweet'><div class='tweet_text' contenteditable='true'>${tweet_text}</div><div class='tweet_img'><img src='${tweet_img}' alt=''></div></div><div class='tweet_info'><span class='time'>${time}</span>・<span class='date'>${date}</span>・<span class='client'>Twitter Web Client</span></div><div class='rt'><span class='number'>${number_rt}</span>件のリツイート　<span class='number'>${number_fav}</span>件のいいね</div></div></div>`
}

const createTweetList = json => {
  return json.map((tweet, index) => {
    const div = document.createElement('div')
    div.innerHTML = createDOMTemplate(tweet, index)
    return div
  })
}

const renderTweets = tweetList => {
  tweetList.forEach(elem => {
    document.querySelector('#render').appendChild(elem)
  })
}

export const tweetRenderer = () => renderTweets(createTweetList(tweets))
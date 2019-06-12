const superagent = require('superagent')
const clipboardy = require('clipboardy')

const getWeb = () => {
  return superagent.get(
    'https://zhongchou.modian.com/realtime/get_simple_product?ids=61433&jsonpcallback=')
}

const init = () => {
  getWeb().then(resp => {
    const
      text = resp.text,
      text_json = text.slice(32, text.length - 3),
      data = JSON.parse(text_json)

    const
      backer_money_rew = parseInt(data.backer_money_rew),
      backer_count = data.backer_count

    const
      nextStep = (Math.floor(backer_money_rew / 100000) + 1) * 10,
      nextLack = nextStep * 10000 - backer_money_rew

    return `大家好，我是本群的“提醒众筹小助手”，到目前为止已经有 ${backer_count} 人参与筹得了 ${backer_money_rew} 元，离下个解锁目标 ${nextStep} 万元还差 ${nextLack} 元。希望看到此消息的人可以和我一起来低空飞行，让我们一起成为众筹小能手吧！`
  }).then(text => {
    console.log(text)
    clipboardy.write(text)
  })
}

init()
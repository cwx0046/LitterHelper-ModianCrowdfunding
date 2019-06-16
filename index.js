const default__project_id = 61433
let storage_key_name = 'modian_saved_data_61433'

const storage = {
  save (new_date) {
    const
      data = this.load(),
      last_data = data.list.length > 0 ? data.list[data.list.length - 1] : null,
      data_to_save = Object.assign({}, new_date)

    delete data_to_save.logo_url

    data.logo_url = new_date.logo_url

    // 与上个数据日期对比，同日数据覆盖
    if (last_data && (last_data.date === data_to_save.date)) {
      data.list[data.list.length - 1] = data_to_save
    } else {
      data.list.push(data_to_save)
    }

    localStorage.setItem(storage_key_name, JSON.stringify(data))
  },

  load () {
    let output = localStorage.getItem(storage_key_name)

    if (output) {
      output = JSON.parse(output)
    } else {
      output = {
        logo_url: '',
        list: [],
      }
    }

    return output
  },
}

function makeRequest (method, url) {
  return new Promise(function (resolve, reject) {
    const xhr = new XMLHttpRequest()
    xhr.open(method, url)
    xhr.onload = function () {
      if (this.status >= 200 && this.status < 300) {
        resolve(xhr.response)
      } else {
        reject({
          status: this.status,
          statusText: xhr.statusText,
        })
      }
    }
    xhr.onerror = function () {
      reject({
        status: this.status,
        statusText: xhr.statusText,
      })
    }
    xhr.send()
  })
}

function renderToTable (data) {
  storage.save({
    logo_url: data.logo2,
    date: data.date,
    backer_money_rew: data.backer_money_rew,
    backer_count: data.backer_count,
  })
  render(storage.load())

  function render (data) {
    const
      dom = document.querySelector('#dataTable tbody'),
      tr_list = []

    renderLogo(data.logo_url)

    data.list.forEach((item, index) => {
      const
        yesterday = data.list[index - 1],
        avg = Math.round(item.backer_money_rew / item.backer_count)
      let increase

      if (yesterday) {
        const
          backer_money_rew = item.backer_money_rew - yesterday.backer_money_rew,
          backer_count = item.backer_count - yesterday.backer_count,
          avg = Math.round(backer_money_rew / backer_count) || 0

        increase = {
          backer_money_rew: backer_money_rew,
          backer_count: backer_count,
          avg: avg,
        }
      } else {
        increase = {
          backer_money_rew: '-',
          backer_count: '-',
          avg: '-',
        }
      }

      const td_list = [
        createTD(item.date, 'center'),
        createTD(item.backer_money_rew, 'right'),
        createTD(item.backer_count, 'right'),
        createTD(avg, 'right'),
        createTD(increase.backer_money_rew, 'right'),
        createTD(increase.backer_count, 'right'),
        createTD(increase.avg, 'right'),
      ]

      const tr = document.createElement('tr')

      td_list.forEach(td => {
        tr.appendChild(td)
      })

      tr_list.push(tr)
    })

    tr_list.forEach(item => {
      dom.appendChild(item)
    })

    function renderLogo (src) {
      document.querySelector('.mainView').src = src
    }

    function createTD (text, text_align) {
      const el = document.createElement('td')

      el.setAttribute('class', 'text-' + text_align)
      el.innerText = text

      return el
    }
  }
}

function init () {
  return makeRequest('GET', getProjectAPI()).then(text => {
    const
      text_json = text.slice(32, text.length - 3),
      data = JSON.parse(text_json)

    buildQQMessage(data)
    formatData(data)
    renderToTable(data)

    return data

    function buildQQMessage (data) {
      const
        backer_money_rew = parseFloat(data.backer_money_rew),
        backer_count = data.backer_count

      const
        nextStep = (Math.floor(backer_money_rew / 100000) + 1) * 10,
        nextLack = nextStep * 10000 - backer_money_rew

      let result

      if (+data.id === default__project_id) {
        result = `大家好，我是本群的“提醒众筹小助手”，到目前为止已经有 ${backer_count} 人参与筹得了 ${backer_money_rew} 元，离下个解锁目标 ${nextStep} 万元还差 ${nextLack} 元。希望看到此消息的人可以和我一起来低空飞行，让我们一起成为众筹小能手吧！`
      } else {
        result = `“${data['short_title']}” 项目到目前为止已筹得 ${backer_money_rew} 元，共 ${backer_count} 人参与。`
        window.document.title = `“${data['short_title']}” 项目数据`
      }

      document.querySelector('#littleHelperText').value = result

      return result
    }

    function formatData (data) {
      let
        date = new Date(),
        YYYY = date.getFullYear(),
        MM = date.getMonth() + 1,
        DD = date.getDate()

      if (MM < 10) MM = '0' + MM
      if (DD < 10) DD = '0' + DD

      data.date = [YYYY, MM, DD].join('-')
    }
  }).catch(err => {
    console.log(err)
    return err
  })

  function getProjectAPI () {
    const
      Modian_URL = 'https://zhongchou.modian.com/realtime/get_simple_product'

    const
      href = document.location.href,
      query_str = href.substring(href.indexOf('?') + 1),
      searchParams = new URLSearchParams(query_str),
      project_id = searchParams.get('id') || default__project_id,
      apiParams = new URLSearchParams()

    storage_key_name = `modian_saved_data_${project_id}`

    apiParams.set('ids', project_id)
    apiParams.set('jsonpcallback', '')

    return Modian_URL + '?' + apiParams.toString()
  }
}

function actionCopy (elm) {
  const text_dom = document.querySelector('#littleHelperText')

  text_dom.select()

  document.execCommand('copy')

  elm.innerText = '已复制'
}

init()
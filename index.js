let storage_key_name

const storage = {
  save(new_date) {
    const
      data = this.load(),
      last_data = data.list.length > 0 ? data.list[data.list.length - 1] : null,
      data_to_save = Object.assign({}, new_date)

    delete data_to_save.logo_url

    data.logo_url = new_date.logo_url

    // 与上个数据日期对比，同日数据覆盖
    if (last_data && isSameDate(last_data.date, data_to_save.date)) {
      data.list[data.list.length - 1] = data_to_save
    } else {
      data.list.push(data_to_save)
    }

    localStorage.setItem(storage_key_name, JSON.stringify(data))

    function isSameDate(date1_str, date2_str) {
      const date1 = new Date(date1_str)
      const date2 = new Date(date2_str)

      return (date1.getMonth() === date2.getMonth())
        && (date1.getDate() === date2.getDate())
    }
  },

  load() {
    let output = localStorage.getItem(storage_key_name)

    if (output) {
      output = JSON.parse(output)
    } else {
      output = {
        logo_url: '',
        list: []
      }
    }

    return output
  }
}

function makeRequest(method, url) {
  return new Promise(function(resolve, reject) {
    const xhr = new XMLHttpRequest()
    xhr.open(method, url)
    xhr.onload = function() {
      if (this.status >= 200 && this.status < 300) {
        resolve(xhr.response)
      } else {
        reject({
          status: this.status,
          statusText: xhr.statusText
        })
      }
    }
    xhr.onerror = function() {
      reject({
        status: this.status,
        statusText: xhr.statusText
      })
    }
    xhr.send()
  })
}

function renderToTable(data) {
  storage.save({
    logo_url: data.logo2,
    date: data.date,
    backer_money_rew: data.backer_money_rew,
    backer_count: data.backer_count
  })
  render(storage.load())

  function render(data) {
    const
      dom = document.querySelector('#dataTable tbody'),
      tr_list = []

    renderLogo(data.logo_url)

    data.list.forEach((item, index) => {
      const
        yesterday = data.list[index - 1],
        avg = financeFormat(item.backer_money_rew / item.backer_count)
      let increase

      if (yesterday) {
        const
          backer_money_rew = item.backer_money_rew - yesterday.backer_money_rew,
          backer_count = item.backer_count - yesterday.backer_count,
          avg = backer_money_rew / backer_count || 0

        increase = {
          backer_money_rew: financeFormat(backer_money_rew),
          backer_count: backer_count,
          avg: financeFormat(avg)
        }
      } else {
        increase = {
          backer_money_rew: '-',
          backer_count: '-',
          avg: '-'
        }
      }

      const td_list = [
        createTD(item.date, 'center'),
        createTD(financeFormat(item.backer_money_rew), 'right'),
        createTD(item.backer_count, 'right'),
        createTD(avg, 'right'),
        createTD(increase.backer_money_rew, 'right'),
        createTD(increase.backer_count, 'right'),
        createTD(increase.avg, 'right')
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

    function renderLogo(src) {
      document.querySelector('.mainView').src = src
    }

    function createTD(text, text_align) {
      const el = document.createElement('td')

      el.setAttribute('class', 'text-' + text_align)
      el.innerText = text

      return el
    }
  }
}

function financeFormat(value) {
  return value.toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  })
}

function init() {

  return getProjectAPI()
    .then(url => {
      return makeRequest('GET', url)
    })
    .then(text => {
      const
        text_json = text.slice(32, text.length - 3),
        data = JSON.parse(text_json)

      buildQQMessage(data)
      formatDate(data)
      renderToTable(data)

      return data

    })
    .catch(err => {
      document.querySelector('.container').remove()
      document.write(err)
      return err
    })

  function buildQQMessage(data) {
    const
      backer_money_rew = financeFormat(data.backer_money_rew),
      backer_count = data.backer_count,
      avg = financeFormat(backer_money_rew / backer_count || 0)

    let result

    result = `“${data['short_title']}”项目已筹得${backer_money_rew}元，共${backer_count}人参与，人均${avg}元。`
    window.document.title = `“${data['short_title']}” 项目数据`
    document.querySelector('#littleHelperText').value = result

    return result
  }

  function formatDate(data) {
    let
      date = new Date(),
      MM = date.getMonth() + 1,
      DD = date.getDate()

    if (MM < 10) MM = '0' + MM
    if (DD < 10) DD = '0' + DD

    data.date = [MM, DD].join('-')
  }

  function getProjectAPI() {
    const
      Modian_URL = 'https://zhongchou.modian.com/realtime/get_simple_product'

    const
      href = document.location.href,
      query_str = href.substring(href.indexOf('?') + 1),
      searchParams = new URLSearchParams(query_str),
      project_id = searchParams.get('id'),
      apiParams = new URLSearchParams()

    storage_key_name = `modian_saved_data_${project_id}`

    apiParams.set('ids', project_id)
    apiParams.set('jsonpcallback', '')

    return project_id
      ? Promise.resolve(Modian_URL + '?' + apiParams.toString())
      : Promise.reject('No project ID.')
  }
}

function actionCopy(elm) {
  const text_dom = document.querySelector('#littleHelperText')

  text_dom.select()

  document.execCommand('copy')

  elm.innerText = '已复制'
}

init().then(() => {})

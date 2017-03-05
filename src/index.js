import _ from 'lodash'
import { baidu } from 'yf-website-tool'
import moment from 'moment'

let baiduBiz = (biz, fpm)=>{
  return {
    push: async ()=>{
      try{
        let sites = await fpm.M.findAsync({
          table: 'fpm_baidu_site',
          condition: 'delflag = 0'
        });
				for(let i = 0; i < sites.length; i++){
					let site = sites[i]
          let result = await baidu.pusher.pushUrls(site)
				}
      }catch(e){
        console.log(e)
      }
      return {
        data: 1
      }
    },
    check: async ()=>{
      try{
        let sites = await fpm.M.findAsync({
          table: 'fpm_baidu_site',
          condition: 'delflag = 0'
        });
        sites = _.map(sites, site => {
					site.result = JSON.parse(site.result)
					site.keywords = JSON.parse(site.keywords)
					return site;
        })
				for(let i = 0; i < sites.length; i++){
					let site = sites[i]
					let data = {}
					data.domain = site.domain
					data.site = await baidu.spider.checkSite(site.domain)
          data.keywords = await baidu.spider.checkKeywords(site)
          let mailData = {
            templateId: 2,
            to: site.result.to,
            subject: site.domain + '@' + moment().format('MM/DD HH:mm'),
            data: data,
          }
          data = await fpm.execute('system.sendMail', mailData, '0.0.1')
				}

      }catch(e){
        console.log(e)
      }
      return {
        data: 1
      }
    }
  }
}


export default {
  bind: (fpm) => {
    fpm.registerAction('BEFORE_MODULES_ADDED', (args) => {
      let biz = args[0]
      if(biz.v === '0.0.1'){
        biz.m = _.assign(biz.m, {
          baidu: baiduBiz(biz, fpm)
        })
      }
    })
  }
}

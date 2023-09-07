module.exports = [
  {
    title: 'Streets',
    style: 'mapbox://styles/huanglii/clm8knsuz012801r41pbwdcku'
  },
  {
    title: 'Satellite Streets',
    style: 'mapbox://styles/huanglii/cl0j3k0wn000n14nznby52wod'
  },
  {
    title: 'Outdoors',
    style: 'mapbox://styles/huanglii/clm7ulxu800mc01rc0l206t3c'
  },
  {
    title: 'Light',
    style: 'mapbox://styles/huanglii/clm93m2qr011a01r671y2hjjm'
  },
  {
    title: 'Dark',
    style: 'mapbox://styles/huanglii/clm8quldc013701nza7a35j7j'
  },
  {
    title: '天地图-影像',
    style: {
      name: 'tdt-satellite',
      version: 8,
      glyphs: 'mapbox://fonts/mapbox/{fontstack}/{range}.pbf',
      sources: {
        'satellite': {
          type: 'raster',
          tiles: [
            "https://t0.tianditu.gov.cn/DataServer?T=img_w&x={x}&y={y}&l={z}&tk=98390210b003e812656026ef694bbbee",
            "https://t1.tianditu.gov.cn/DataServer?T=img_w&x={x}&y={y}&l={z}&tk=98390210b003e812656026ef694bbbee",
            "https://t2.tianditu.gov.cn/DataServer?T=img_w&x={x}&y={y}&l={z}&tk=98390210b003e812656026ef694bbbee",
            "https://t3.tianditu.gov.cn/DataServer?T=img_w&x={x}&y={y}&l={z}&tk=98390210b003e812656026ef694bbbee",
            "https://t4.tianditu.gov.cn/DataServer?T=img_w&x={x}&y={y}&l={z}&tk=98390210b003e812656026ef694bbbee",
            "https://t5.tianditu.gov.cn/DataServer?T=img_w&x={x}&y={y}&l={z}&tk=98390210b003e812656026ef694bbbee",
            "https://t6.tianditu.gov.cn/DataServer?T=img_w&x={x}&y={y}&l={z}&tk=98390210b003e812656026ef694bbbee",
            "https://t7.tianditu.gov.cn/DataServer?T=img_w&x={x}&y={y}&l={z}&tk=98390210b003e812656026ef694bbbee"
          ],
          tileSize: 256,
          attribution: '&copy; <a href="https://www.tianditu.gov.cn">天地图</a>'
        }
      },
      layers: [
        {
          id: 'satellite',
          type: 'raster',
          source: 'satellite',
          minzoom: 0,
          maxzoom: 18
        }
      ]
    }
  }
];

document.addEventListener("DOMContentLoaded", () => {
  fetchAllData()
    .then(() => {
      initTariffControls()
      initTabs()
      initCharts()
      calculateImpacts()

      document.getElementById("reset-tariffs").addEventListener("click", resetTariffs)
      document.getElementById("refresh-data").addEventListener("click", fetchAllData)
    })
    .catch((error) => {
      console.error("Failed to initialize application:", error)
      alert("Failed to load data. Using fallback data instead.")
      useDefaultData()

      initTariffControls()
      initTabs()
      initCharts()
      calculateImpacts()

      document.getElementById("reset-tariffs").addEventListener("click", resetTariffs)
      document.getElementById("refresh-data").addEventListener("click", fetchAllData)
    })
})

let currentTariffs = {
  china: {
    manufacturing: 25,
    electronics: 15,
    agriculture: 10,
  },
  eu: {
    automotive: 10,
    agriculture: 8,
  },
  nafta: {
    steel: 5,
    agriculture: 2,
  },
}

let baselineData = {
  gdp: {
    growth: 2.3,
    value: 23.32,
  },
  trade: {
    deficit: 616,
    imports: 3.1,
    exports: 2.5,
  },
  consumer: {
    inflation: 3.4,
    householdSpending: 72000,
  },
  jobs: {
    manufacturing: 12.9,
    service: 132.6,
  },
}

function showLoading() {
  document.getElementById("loading-overlay").style.display = "flex"
}

function hideLoading() {
  document.getElementById("loading-overlay").style.display = "none"
}

async function fetchAllData() {
  showLoading();

  try {
    const [economicData, tariffData] = await Promise.all([
      fetchEconomicData(),
      fetchTariffData()
    ]);

    updateBaselineData(economicData);
    updateTariffData(tariffData);
    updateDataSourceInfo(economicData.source || tariffData.source, new Date());

    if (window.gdpChart) {
      calculateImpacts();
    }

    hideLoading();
    return { economicData, tariffData };
  } catch (error) {
    console.error("Error fetching data:", error);
    hideLoading();
    throw error;
  }
}

async function fetchEconomicData() {
  try {
    const response = await fetch("http://<your-ec2-public-ip>/api/economic", {
      method: "GET",
      headers: { "Accept": "application/json" }
    });

    if (!response.ok) {
      throw new Error(`Economic API responded with status: ${response.status}`);
    }

    const data = await response.json();

    return data;

  } catch (error) {
    console.warn("Economic API unavailable, using simulated data");
    return generateSimulatedEconomicData();
  }
}

async function fetchTariffData() {
    // will change endpoint logic in the future so it retrieves tarrifs in real time too
  try {
    const response = await fetch("http://<your-ec2-public-ip>/api/tariff", {
      method: "GET",
      headers: { "Accept": "application/json" }
    });

    if (!response.ok) {
      throw new Error(`Tariff API responded with status: ${response.status}`);
    }

    const data = await response.json();

    return data;

  } catch (error) {
    console.warn("Tariff API unavailable, using simulated data");
    return generateSimulatedTariffData();
  }
}

function generateSimulatedEconomicData() {
  const variation = () => (Math.random() - 0.5) * 0.4
  
  return {
    gdp: {
      growth: 2.3 + variation(),
      value: 23.32 + variation() * 2
    },
    trade: {
      deficit: 616 + variation() * 50,
      imports: 3.1 + variation() * 0.3,
      exports: 2.5 + variation() * 0.2
    },
    consumer: {
      inflation: 3.4 + variation(),
      householdSpending: 72000 + variation() * 5000
    },
    jobs: {
      manufacturing: 12.9 + variation() * 0.5,
      service: 132.6 + variation() * 3
    },
    source: "Simulated Economic Data API",
    lastUpdated: new Date().toISOString()
  }
}

function generateSimulatedTariffData() {
  const variation = () => Math.max(0, Math.random() * 10 - 5)
  
  return {
    china: {
      manufacturing: Math.max(0, 25 + variation()),
      electronics: Math.max(0, 15 + variation()),
      agriculture: Math.max(0, 10 + variation())
    },
    eu: {
      automotive: Math.max(0, 10 + variation()),
      agriculture: Math.max(0, 8 + variation())
    },
    nafta: {
      steel: Math.max(0, 5 + variation()),
      agriculture: Math.max(0, 2 + variation())
    },
    source: "Simulated Trade Data API",
    lastUpdated: new Date().toISOString()
  }
}

function updateBaselineData(apiData) {
  baselineData = {
    gdp: {
      growth: apiData?.gdp?.growth || baselineData.gdp.growth,
      value: apiData?.gdp?.value || baselineData.gdp.value,
    },
    trade: {
      deficit: apiData?.trade?.deficit || baselineData.trade.deficit,
      imports: apiData?.trade?.imports || baselineData.trade.imports,
      exports: apiData?.trade?.exports || baselineData.trade.exports,
    },
    consumer: {
      inflation: apiData?.consumer?.inflation || baselineData.consumer.inflation,
      householdSpending: apiData?.consumer?.householdSpending || baselineData.consumer.householdSpending,
    },
    jobs: {
      manufacturing: apiData?.jobs?.manufacturing || baselineData.jobs.manufacturing,
      service: apiData?.jobs?.service || baselineData.jobs.service,
    },
  }
}

function updateTariffData(tariffApiData) {
  if (!tariffApiData) return

  currentTariffs = {
    china: {
      manufacturing: tariffApiData?.china?.manufacturing || currentTariffs.china.manufacturing,
      electronics: tariffApiData?.china?.electronics || currentTariffs.china.electronics,
      agriculture: tariffApiData?.china?.agriculture || currentTariffs.china.agriculture,
    },
    eu: {
      automotive: tariffApiData?.eu?.automotive || currentTariffs.eu.automotive,
      agriculture: tariffApiData?.eu?.agriculture || currentTariffs.eu.agriculture,
    },
    nafta: {
      steel: tariffApiData?.nafta?.steel || currentTariffs.nafta.steel,
      agriculture: tariffApiData?.nafta?.agriculture || currentTariffs.nafta.agriculture,
    },
  }

  updateTariffControls()
}

function updateTariffControls() {
  document.getElementById("china-manufacturing").value = currentTariffs.china.manufacturing
  document.getElementById("china-manufacturing-value").textContent = `${currentTariffs.china.manufacturing.toFixed(1)}%`

  document.getElementById("china-electronics").value = currentTariffs.china.electronics
  document.getElementById("china-electronics-value").textContent = `${currentTariffs.china.electronics.toFixed(1)}%`

  document.getElementById("china-agriculture").value = currentTariffs.china.agriculture
  document.getElementById("china-agriculture-value").textContent = `${currentTariffs.china.agriculture.toFixed(1)}%`

  document.getElementById("eu-automotive").value = currentTariffs.eu.automotive
  document.getElementById("eu-automotive-value").textContent = `${currentTariffs.eu.automotive.toFixed(1)}%`

  document.getElementById("eu-agriculture").value = currentTariffs.eu.agriculture
  document.getElementById("eu-agriculture-value").textContent = `${currentTariffs.eu.agriculture.toFixed(1)}%`

  document.getElementById("nafta-steel").value = currentTariffs.nafta.steel
  document.getElementById("nafta-steel-value").textContent = `${currentTariffs.nafta.steel.toFixed(1)}%`

  document.getElementById("nafta-agriculture").value = currentTariffs.nafta.agriculture
  document.getElementById("nafta-agriculture-value").textContent = `${currentTariffs.nafta.agriculture.toFixed(1)}%`
}

function updateDataSourceInfo(source, lastUpdated) {
  document.getElementById("data-source").textContent = source || "Bureau of Economic Analysis & Federal Reserve"

  const date = lastUpdated ? new Date(lastUpdated) : new Date()
  document.getElementById("data-updated").textContent = date.toLocaleString()
}

function useDefaultData() {
  baselineData = {
    gdp: {
      growth: 2.3,
      value: 23.32,
    },
    trade: {
      deficit: 616,
      imports: 3.1,
      exports: 2.5,
    },
    consumer: {
      inflation: 3.4,
      householdSpending: 72000,
    },
    jobs: {
      manufacturing: 12.9,
      service: 132.6,
    },
  }

  currentTariffs = {
    china: {
      manufacturing: 25,
      electronics: 15,
      agriculture: 10,
    },
    eu: {
      automotive: 10,
      agriculture: 8,
    },
    nafta: {
      steel: 5,
      agriculture: 2,
    },
  }

  updateTariffControls()
  updateDataSourceInfo("Default data (API unavailable)", new Date())
}

function initTariffControls() {
  const tariffControls = document.querySelectorAll('input[type="range"]')

  tariffControls.forEach((control) => {
    const valueDisplay = document.getElementById(`${control.id}-value`)
    valueDisplay.textContent = `${parseFloat(control.value).toFixed(1)}%`

    control.addEventListener("input", function () {
      valueDisplay.textContent = `${parseFloat(this.value).toFixed(1)}%`
      calculateImpacts()
    })
  })
}

function initTabs() {
  const tabButtons = document.querySelectorAll(".tab-btn")
  const tabContents = document.querySelectorAll(".tab-content")

  tabButtons.forEach((button) => {
    button.addEventListener("click", function () {
      tabButtons.forEach((btn) => btn.classList.remove("active"))
      tabContents.forEach((content) => content.classList.remove("active"))

      this.classList.add("active")
      const tabId = this.getAttribute("data-tab")
      document.getElementById(tabId).classList.add("active")
    })
  })
}

function resetTariffs() {
  updateTariffControls()
  calculateImpacts()
}

function initCharts() {
  requestAnimationFrame(() => {
    initGDPChart()
    initTradeChart()
    initPriceChart()
    initJobsChart()
  })
}

function initGDPChart() {
  const canvas = document.getElementById("gdp-chart")
  const ctx = canvas.getContext("2d")

  const parentWidth = canvas.parentElement.offsetWidth || 400
  const parentHeight = canvas.parentElement.offsetHeight || 300

  canvas.width = parentWidth > 0 ? parentWidth : 400
  canvas.height = parentHeight > 0 ? parentHeight : 300

  window.gdpChart = {
    ctx: ctx,
    canvas: canvas,
    data: {
      current: baselineData.gdp.growth,
      projected: baselineData.gdp.growth,
    },
  }

  drawGDPChart()
}

function initTradeChart() {
  const canvas = document.getElementById("trade-chart")
  const ctx = canvas.getContext("2d")

  const parentWidth = canvas.parentElement.offsetWidth || 400
  const parentHeight = canvas.parentElement.offsetHeight || 300

  canvas.width = parentWidth > 0 ? parentWidth : 400
  canvas.height = parentHeight > 0 ? parentHeight : 300

  window.tradeChart = {
    ctx: ctx,
    canvas: canvas,
    data: {
      currentImports: baselineData.trade.imports,
      currentExports: baselineData.trade.exports,
      projectedImports: baselineData.trade.imports,
      projectedExports: baselineData.trade.exports,
    },
  }

  drawTradeChart()
}

function initPriceChart() {
  const canvas = document.getElementById("price-chart")
  const ctx = canvas.getContext("2d")

  const parentWidth = canvas.parentElement.offsetWidth || 400
  const parentHeight = canvas.parentElement.offsetHeight || 300

  canvas.width = parentWidth > 0 ? parentWidth : 400
  canvas.height = parentHeight > 0 ? parentHeight : 300

  window.priceChart = {
    ctx: ctx,
    canvas: canvas,
    data: {
      current: baselineData.consumer.inflation,
      projected: baselineData.consumer.inflation,
      sectors: ["Electronics", "Automotive", "Food", "Clothing", "Other"],
    },
  }

  drawPriceChart()
}

function initJobsChart() {
  const canvas = document.getElementById("jobs-chart")
  const ctx = canvas.getContext("2d")

  const parentWidth = canvas.parentElement.offsetWidth || 400
  const parentHeight = canvas.parentElement.offsetHeight || 300

  canvas.width = parentWidth > 0 ? parentWidth : 400
  canvas.height = parentHeight > 0 ? parentHeight : 300

  window.jobsChart = {
    ctx: ctx,
    canvas: canvas,
    data: {
      manufacturing: 0,
      service: 0,
      net: 0,
    },
  }

  drawJobsChart()
}


function drawGDPChart() {
  const { ctx, canvas, data } = window.gdpChart
  const width = canvas.width
  const height = canvas.height

  ctx.clearRect(0, 0, width, height)

  const barWidth = width / 5
  const maxValue = Math.max(data.current, data.projected) * 1.5
  const scale = height / maxValue

  ctx.beginPath()
  ctx.strokeStyle = "#ccc"
  ctx.lineWidth = 1
  ctx.moveTo(width / 4, height - 30)
  ctx.lineTo(width / 4, 30)
  ctx.moveTo(width / 4, height - 30)
  ctx.lineTo(width - 30, height - 30)
  ctx.stroke()

  ctx.fillStyle = "#666"
  ctx.font = "12px Arial"
  ctx.textAlign = "right"

  for (let i = 0; i <= 5; i++) {
    const value = (maxValue / 5) * i
    const y = height - 30 - value * scale
    ctx.fillText(value.toFixed(1) + "%", width / 4 - 10, y + 5)

    ctx.beginPath()
    ctx.strokeStyle = "#eee"
    ctx.moveTo(width / 4, y)
    ctx.lineTo(width - 30, y)
    ctx.stroke()
  }

  const currentBarHeight = data.current * scale
  ctx.fillStyle = "#4b86b4"
  ctx.fillRect(width / 3, height - 30 - currentBarHeight, barWidth, currentBarHeight)

  const projectedBarHeight = data.projected * scale
  ctx.fillStyle = data.projected >= data.current ? "#4caf50" : "#f44336"
  ctx.fillRect((width * 2) / 3, height - 30 - projectedBarHeight, barWidth, projectedBarHeight)

  ctx.fillStyle = "#333"
  ctx.textAlign = "center"
  ctx.font = "14px Arial"
  ctx.fillText("Current", width / 3 + barWidth / 2, height - 10)
  ctx.fillText("Projected", (width * 2) / 3 + barWidth / 2, height - 10)

  ctx.fillStyle = "#fff"
  ctx.font = "bold 14px Arial"
  ctx.fillText(data.current.toFixed(1) + "%", width / 3 + barWidth / 2, height - 35 - currentBarHeight)
  ctx.fillText(data.projected.toFixed(1) + "%", (width * 2) / 3 + barWidth / 2, height - 35 - projectedBarHeight)

  ctx.fillStyle = "#333"
  ctx.font = "bold 16px Arial"
  ctx.textAlign = "center"
  ctx.fillText("GDP Growth Rate", width / 2, 20)
}

function drawTradeChart() {
  const { ctx, canvas, data } = window.tradeChart
  const width = canvas.width
  const height = canvas.height

  ctx.clearRect(0, 0, width, height)

  const barWidth = width / 10
  const maxValue = Math.max(data.currentImports, data.projectedImports) * 1.2
  const scale = (height - 60) / maxValue

  ctx.beginPath()
  ctx.strokeStyle = "#ccc"
  ctx.lineWidth = 1
  ctx.moveTo(width / 6, height - 30)
  ctx.lineTo(width / 6, 30)
  ctx.moveTo(width / 6, height - 30)
  ctx.lineTo(width - 30, height - 30)
  ctx.stroke()

  ctx.fillStyle = "#666"
  ctx.font = "12px Arial"
  ctx.textAlign = "right"

  for (let i = 0; i <= 5; i++) {
    const value = (maxValue / 5) * i
    const y = height - 30 - value * scale
    ctx.fillText("$" + value.toFixed(1) + "T", width / 6 - 10, y + 5)

    ctx.beginPath()
    ctx.strokeStyle = "#eee"
    ctx.moveTo(width / 6, y)
    ctx.lineTo(width - 30, y)
    ctx.stroke()
  }

  const currentImportsHeight = data.currentImports * scale
  const currentExportsHeight = data.currentExports * scale

  ctx.fillStyle = "#f44336"
  ctx.fillRect(width / 3 - barWidth - 10, height - 30 - currentImportsHeight, barWidth, currentImportsHeight)

  ctx.fillStyle = "#4caf50"
  ctx.fillRect(width / 3, height - 30 - currentExportsHeight, barWidth, currentExportsHeight)

  const projectedImportsHeight = data.projectedImports * scale
  const projectedExportsHeight = data.projectedExports * scale

  ctx.fillStyle = "#f44336"
  ctx.fillRect((width * 2) / 3 - barWidth - 10, height - 30 - projectedImportsHeight, barWidth, projectedImportsHeight)

  ctx.fillStyle = "#4caf50"
  ctx.fillRect((width * 2) / 3, height - 30 - projectedExportsHeight, barWidth, projectedExportsHeight)

  ctx.fillStyle = "#333"
  ctx.textAlign = "center"
  ctx.font = "14px Arial"

  ctx.fillText("Imports", width / 3 - barWidth - 10 + barWidth / 2, height - 10)
  ctx.fillText("Exports", width / 3 + barWidth / 2, height - 10)

  ctx.fillText("Imports", (width * 2) / 3 - barWidth - 10 + barWidth / 2, height - 10)
  ctx.fillText("Exports", (width * 2) / 3 + barWidth / 2, height - 10)

  ctx.font = "bold 14px Arial"
  ctx.fillText("Current", width / 3 - 5, height - 45)
  ctx.fillText("Projected", (width * 2) / 3 - 5, height - 45)

  ctx.fillStyle = "#fff"
  ctx.font = "bold 12px Arial"

  ctx.fillText(
    "$" + data.currentImports.toFixed(1) + "T",
    width / 3 - barWidth - 10 + barWidth / 2,
    height - 35 - currentImportsHeight,
  )
  ctx.fillText("$" + data.currentExports.toFixed(1) + "T", width / 3 + barWidth / 2, height - 35 - currentExportsHeight)

  ctx.fillText(
    "$" + data.projectedImports.toFixed(1) + "T",
    (width * 2) / 3 - barWidth - 10 + barWidth / 2,
    height - 35 - projectedImportsHeight,
  )
  ctx.fillText(
    "$" + data.projectedExports.toFixed(1) + "T",
    (width * 2) / 3 + barWidth / 2,
    height - 35 - projectedExportsHeight,
  )

  ctx.fillStyle = "#333"
  ctx.font = "bold 16px Arial"
  ctx.textAlign = "center"
  ctx.fillText("Trade Balance (Imports vs Exports)", width / 2, 20)
}

function drawPriceChart() {
  const { ctx, canvas, data } = window.priceChart
  const width = canvas.width
  const height = canvas.height

  ctx.clearRect(0, 0, width, height)

  const barWidth = 30
  const gap = 10
  const groupWidth = barWidth * 2 + gap
  const groupGap = 40
  const startX = width / 6
  const maxValue = 10
  const scale = (height - 60) / maxValue

  ctx.beginPath()
  ctx.strokeStyle = "#ccc"
  ctx.lineWidth = 1
  ctx.moveTo(startX, height - 30)
  ctx.lineTo(startX, 30)
  ctx.moveTo(startX, height - 30)
  ctx.lineTo(width - 30, height - 30)
  ctx.stroke()

  ctx.fillStyle = "#666"
  ctx.font = "12px Arial"
  ctx.textAlign = "right"

  for (let i = 0; i <= 5; i++) {
    const value = (maxValue / 5) * i
    const y = height - 30 - value * scale
    ctx.fillText(value.toFixed(1) + "%", startX - 10, y + 5)

    ctx.beginPath()
    ctx.strokeStyle = "#eee"
    ctx.moveTo(startX, y)
    ctx.lineTo(width - 30, y)
    ctx.stroke()
  }

  const sectorData = generateSectorInflationData()

  for (let i = 0; i < data.sectors.length; i++) {
    const x = startX + 30 + i * (groupWidth + groupGap)

    const currentHeight = sectorData.current[i] * scale
    ctx.fillStyle = "#4b86b4"
    ctx.fillRect(x, height - 30 - currentHeight, barWidth, currentHeight)

    const projectedHeight = sectorData.projected[i] * scale
    ctx.fillStyle = sectorData.projected[i] > sectorData.current[i] ? "#f44336" : "#4caf50"
    ctx.fillRect(x + barWidth + gap, height - 30 - projectedHeight, barWidth, projectedHeight)

    ctx.fillStyle = "#fff"
    ctx.font = "bold 12px Arial"
    ctx.textAlign = "center"

    if (currentHeight > 20) {
      ctx.fillText(sectorData.current[i].toFixed(1) + "%", x + barWidth / 2, height - 35 - currentHeight)
    }

    if (projectedHeight > 20) {
      ctx.fillText(
        sectorData.projected[i].toFixed(1) + "%",
        x + barWidth + gap + barWidth / 2,
        height - 35 - projectedHeight,
      )
    }

    ctx.fillStyle = "#333"
    ctx.font = "12px Arial"
    ctx.fillText(data.sectors[i], x + barWidth + gap / 2, height - 10)
  }

  ctx.fillStyle = "#4b86b4"
  ctx.fillRect(width - 150, 50, 15, 15)
  ctx.fillStyle = "#333"
  ctx.textAlign = "left"
  ctx.fillText("Current", width - 130, 62)

  ctx.fillStyle = "#f44336"
  ctx.fillRect(width - 150, 75, 15, 15)
  ctx.fillStyle = "#333"
  ctx.fillText("Projected (Increase)", width - 130, 87)

  ctx.fillStyle = "#4caf50"
  ctx.fillRect(width - 150, 100, 15, 15)
  ctx.fillStyle = "#333"
  ctx.fillText("Projected (Decrease)", width - 130, 112)

  ctx.fillStyle = "#333"
  ctx.font = "bold 16px Arial"
  ctx.textAlign = "center"
  ctx.fillText("Consumer Price Impact by Sector", width / 2, 20)
}

function generateSectorInflationData() {
  const sectors = window.priceChart.data.sectors
  const currentData = Array(sectors.length).fill(baselineData.consumer.inflation)
  const projectedData = []

  const chinaMfg = Number.parseFloat(document.getElementById("china-manufacturing").value)
  const chinaElec = Number.parseFloat(document.getElementById("china-electronics").value)
  const chinaAgri = Number.parseFloat(document.getElementById("china-agriculture").value)
  const euAuto = Number.parseFloat(document.getElementById("eu-automotive").value)
  const euAgri = Number.parseFloat(document.getElementById("eu-agriculture").value)

  projectedData[0] = baselineData.consumer.inflation + (chinaElec - currentTariffs.china.electronics) * 0.08

  projectedData[1] = baselineData.consumer.inflation + (euAuto - currentTariffs.eu.automotive) * 0.06

  projectedData[2] =
    baselineData.consumer.inflation +
    (chinaAgri - currentTariffs.china.agriculture) * 0.02 +
    (euAgri - currentTariffs.eu.agriculture) * 0.03

  projectedData[3] = baselineData.consumer.inflation + (chinaMfg - currentTariffs.china.manufacturing) * 0.05

  projectedData[4] =
    baselineData.consumer.inflation +
    (chinaMfg - currentTariffs.china.manufacturing) * 0.01 +
    (chinaElec - currentTariffs.china.electronics) * 0.01

  return {
    current: currentData,
    projected: projectedData,
  }
}

function drawJobsChart() {
  const { ctx, canvas, data } = window.jobsChart
  const width = canvas.width
  const height = canvas.height

  ctx.clearRect(0, 0, width, height)

  const barWidth = width / 5
  const maxValue = Math.max(Math.abs(data.manufacturing), Math.abs(data.service), Math.abs(data.net)) * 1.5 || 1
  const scale = (height - 60) / (maxValue * 2)
  const zeroY = height / 2

  ctx.beginPath()
  ctx.strokeStyle = "#ccc"
  ctx.lineWidth = 1
  ctx.moveTo(width / 4, 30)
  ctx.lineTo(width / 4, height - 30)
  ctx.moveTo(width / 4, zeroY)
  ctx.lineTo(width - 30, zeroY)
  ctx.stroke()

  ctx.fillStyle = "#666"
  ctx.font = "12px Arial"
  ctx.textAlign = "right"

  for (let i = 0; i <= 5; i++) {
    const value = (maxValue / 5) * i
    const y = zeroY - value * scale
    if (y >= 30) {
      ctx.fillText("+" + value.toFixed(0) + "K", width / 4 - 10, y + 5)

      ctx.beginPath()
      ctx.strokeStyle = "#eee"
      ctx.moveTo(width / 4, y)
      ctx.lineTo(width - 30, y)
      ctx.stroke()
    }
  }

  for (let i = 1; i <= 5; i++) {
    const value = (maxValue / 5) * i
    const y = zeroY + value * scale
    if (y <= height - 30) {
      ctx.fillText("-" + value.toFixed(0) + "K", width / 4 - 10, y + 5)

      ctx.beginPath()
      ctx.strokeStyle = "#eee"
      ctx.moveTo(width / 4, y)
      ctx.lineTo(width - 30, y)
      ctx.stroke()
    }
  }

  const mfgBarHeight = data.manufacturing * scale
  ctx.fillStyle = data.manufacturing >= 0 ? "#4caf50" : "#f44336"
  if (data.manufacturing >= 0) {
    ctx.fillRect(width / 3, zeroY - mfgBarHeight, barWidth, mfgBarHeight)
  } else {
    ctx.fillRect(width / 3, zeroY, barWidth, -mfgBarHeight)
  }

  const svcBarHeight = data.service * scale
  ctx.fillStyle = data.service >= 0 ? "#4caf50" : "#f44336"
  if (data.service >= 0) {
    ctx.fillRect(width / 2, zeroY - svcBarHeight, barWidth, svcBarHeight)
  } else {
    ctx.fillRect(width / 2, zeroY, barWidth, -svcBarHeight)
  }

  const netBarHeight = data.net * scale
  ctx.fillStyle = data.net >= 0 ? "#4caf50" : "#f44336"
  if (data.net >= 0) {
    ctx.fillRect((width * 2) / 3, zeroY - netBarHeight, barWidth, netBarHeight)
  } else {
    ctx.fillRect((width * 2) / 3, zeroY, barWidth, -netBarHeight)
  }

  ctx.fillStyle = "#333"
  ctx.textAlign = "center"
  ctx.font = "14px Arial"
  ctx.fillText("Manufacturing", width / 3 + barWidth / 2, height - 10)
  ctx.fillText("Service", width / 2 + barWidth / 2, height - 10)
  ctx.fillText("Net Impact", (width * 2) / 3 + barWidth / 2, height - 10)

  ctx.fillStyle = "#fff"
  ctx.font = "bold 14px Arial"

  if (data.manufacturing !== 0) {
    const mfgLabel = (data.manufacturing >= 0 ? "+" : "") + data.manufacturing.toFixed(0) + "K"
    const mfgLabelY = data.manufacturing >= 0 ? zeroY - mfgBarHeight + 20 : zeroY - mfgBarHeight - 10
    ctx.fillText(mfgLabel, width / 3 + barWidth / 2, mfgLabelY)
  }

  if (data.service !== 0) {
    const svcLabel = (data.service >= 0 ? "+" : "") + data.service.toFixed(0) + "K"
    const svcLabelY = data.service >= 0 ? zeroY - svcBarHeight + 20 : zeroY - svcBarHeight - 10
    ctx.fillText(svcLabel, width / 2 + barWidth / 2, svcLabelY)
  }

  if (data.net !== 0) {
    const netLabel = (data.net >= 0 ? "+" : "") + data.net.toFixed(0) + "K"
    const netLabelY = data.net >= 0 ? zeroY - netBarHeight + 20 : zeroY - netBarHeight - 10
    ctx.fillText(netLabel, (width * 2) / 3 + barWidth / 2, netLabelY)
  }

  ctx.fillStyle = "#333"
  ctx.font = "bold 16px Arial"
  ctx.textAlign = "center"
  ctx.fillText("Job Market Impact (thousands of jobs)", width / 2, 20)
}

function calculateImpacts() {
  const chinaMfg = Number.parseFloat(document.getElementById("china-manufacturing").value)
  const chinaElec = Number.parseFloat(document.getElementById("china-electronics").value)
  const chinaAgri = Number.parseFloat(document.getElementById("china-agriculture").value)
  const euAuto = Number.parseFloat(document.getElementById("eu-automotive").value)
  const euAgri = Number.parseFloat(document.getElementById("eu-agriculture").value)
  const naftaSteel = Number.parseFloat(document.getElementById("nafta-steel").value)
  const naftaAgri = Number.parseFloat(document.getElementById("nafta-agriculture").value)

  const chinaMfgChange = chinaMfg - currentTariffs.china.manufacturing
  const chinaElecChange = chinaElec - currentTariffs.china.electronics
  const chinaAgriChange = chinaAgri - currentTariffs.china.agriculture
  const euAutoChange = euAuto - currentTariffs.eu.automotive
  const euAgriChange = euAgri - currentTariffs.eu.agriculture
  const naftaSteelChange = naftaSteel - currentTariffs.nafta.steel
  const naftaAgriChange = naftaAgri - currentTariffs.nafta.agriculture

  const weightedChange =
    chinaMfgChange * 0.25 +
    chinaElecChange * 0.2 +
    chinaAgriChange * 0.05 +
    euAutoChange * 0.15 +
    euAgriChange * 0.1 +
    naftaSteelChange * 0.15 +
    naftaAgriChange * 0.1

  const gdpImpact = -0.1 * (weightedChange / 5)
  const projectedGDP = baselineData.gdp.growth + gdpImpact

  window.gdpChart.data.current = baselineData.gdp.growth
  window.gdpChart.data.projected = projectedGDP
  drawGDPChart()

  document.getElementById("current-gdp").textContent = baselineData.gdp.growth.toFixed(1) + "%"
  document.getElementById("projected-gdp").textContent = projectedGDP.toFixed(1) + "%"
  document.getElementById("gdp-impact").textContent = gdpImpact.toFixed(1) + "%"

  const gdpImpactElement = document.getElementById("gdp-impact")
  gdpImpactElement.className = "impact-value"
  if (gdpImpact > 0) {
    gdpImpactElement.classList.add("positive")
  } else if (gdpImpact < 0) {
    gdpImpactElement.classList.add("negative")
  } else {
    gdpImpactElement.classList.add("neutral")
  }

  const importChange = -0.05 * weightedChange
  const exportChange = -0.03 * weightedChange

  const projectedImports = baselineData.trade.imports * (1 + importChange / 100)
  const projectedExports = baselineData.trade.exports * (1 + exportChange / 100)
  const currentDeficit = baselineData.trade.deficit
  const projectedDeficit = (projectedImports - projectedExports) * 1000
  const deficitChange = projectedDeficit - currentDeficit

  window.tradeChart.data.currentImports = baselineData.trade.imports
  window.tradeChart.data.currentExports = baselineData.trade.exports
  window.tradeChart.data.projectedImports = projectedImports
  window.tradeChart.data.projectedExports = projectedExports
  drawTradeChart()

  document.getElementById("current-deficit").textContent = "$" + currentDeficit.toFixed(0) + "B"
  document.getElementById("projected-deficit").textContent = "$" + projectedDeficit.toFixed(0) + "B"
  document.getElementById("deficit-change").textContent =
    (deficitChange >= 0 ? "+" : "") + "$" + deficitChange.toFixed(0) + "B"

  const deficitChangeElement = document.getElementById("deficit-change")
  deficitChangeElement.className = "impact-value"
  if (deficitChange < 0) {
    deficitChangeElement.classList.add("positive")
  } else if (deficitChange > 0) {
    deficitChangeElement.classList.add("negative")
  } else {
    deficitChangeElement.classList.add("neutral")
  }

  const inflationImpact = 0.05 * weightedChange
  const projectedInflation = baselineData.consumer.inflation + inflationImpact

  const householdCostImpact = baselineData.consumer.householdSpending * (inflationImpact / 100)

  window.priceChart.data.current = baselineData.consumer.inflation
  window.priceChart.data.projected = projectedInflation
  drawPriceChart()

  document.getElementById("current-inflation").textContent = baselineData.consumer.inflation.toFixed(1) + "%"
  document.getElementById("projected-inflation").textContent = projectedInflation.toFixed(1) + "%"
  document.getElementById("household-cost").textContent = "$" + householdCostImpact.toFixed(0)

  const householdCostElement = document.getElementById("household-cost")
  householdCostElement.className = "impact-value"
  if (householdCostImpact > 0) {
    householdCostElement.classList.add("negative")
  } else if (householdCostImpact < 0) {
    householdCostElement.classList.add("positive")
  } else {
    householdCostElement.classList.add("neutral")
  }

  const manufacturingJobsImpact =
    chinaMfgChange * 2000 + chinaElecChange * 1500 + naftaSteelChange * 1000 - weightedChange * 500

  const serviceJobsImpact = -2000 * weightedChange

  const netJobsImpact = manufacturingJobsImpact + serviceJobsImpact

  window.jobsChart.data.manufacturing = manufacturingJobsImpact / 1000
  window.jobsChart.data.service = serviceJobsImpact / 1000
  window.jobsChart.data.net = netJobsImpact / 1000
  drawJobsChart()

  document.getElementById("manufacturing-jobs").textContent =
    (manufacturingJobsImpact >= 0 ? "+" : "") + manufacturingJobsImpact.toFixed(0)
  document.getElementById("service-jobs").textContent =
    (serviceJobsImpact >= 0 ? "+" : "") + serviceJobsImpact.toFixed(0)
  document.getElementById("net-jobs").textContent = (netJobsImpact >= 0 ? "+" : "") + netJobsImpact.toFixed(0)

  const manufacturingJobsElement = document.getElementById("manufacturing-jobs")
  manufacturingJobsElement.className = "impact-value"
  if (manufacturingJobsImpact > 0) {
    manufacturingJobsElement.classList.add("positive")
  } else if (manufacturingJobsImpact < 0) {
    manufacturingJobsElement.classList.add("negative")
  } else {
    manufacturingJobsElement.classList.add("neutral")
  }

  const serviceJobsElement = document.getElementById("service-jobs")
  serviceJobsElement.className = "impact-value"
  if (serviceJobsImpact > 0) {
    serviceJobsElement.classList.add("positive")
  } else if (serviceJobsImpact < 0) {
    serviceJobsElement.classList.add("negative")
  } else {
    serviceJobsElement.classList.add("neutral")
  }

  const netJobsElement = document.getElementById("net-jobs")
  netJobsElement.className = "impact-value"
  if (netJobsImpact > 0) {
    netJobsElement.classList.add("positive")
  } else if (netJobsImpact < 0) {
    netJobsElement.classList.add("negative")
  } else {
    netJobsElement.classList.add("neutral")
  }
}

document.addEventListener('DOMContentLoaded', () => {
  setTimeout(() => {
    initCharts()
  }, 50)
})

window.addEventListener("resize", () => {
  clearTimeout(window.resizeTimeout)
  window.resizeTimeout = setTimeout(() => {
    const charts = ["gdp-chart", "trade-chart", "price-chart", "jobs-chart"]

    charts.forEach((chartId) => {
      const canvas = document.getElementById(chartId)
      if (canvas && canvas.parentElement) {
        const parentWidth = canvas.parentElement.offsetWidth
        const parentHeight = canvas.parentElement.offsetHeight
        
        if (parentWidth > 0 && parentHeight > 0) {
          canvas.width = parentWidth
          canvas.height = parentHeight
        }
      }
    })

    if (window.gdpChart) drawGDPChart()
    if (window.tradeChart) drawTradeChart()
    if (window.priceChart) drawPriceChart()
    if (window.jobsChart) drawJobsChart()
  }, 100)
})
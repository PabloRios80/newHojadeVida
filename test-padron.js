const https = require("https");

const hoy = new Date().toISOString().split("T")[0];
const body = `<?xml version="1.0" encoding="utf-8"?><soap:Envelope xmlns:soap="http://schemas.xmlsoap.org/soap/envelope/"><soap:Body><BEWsValidaAfi.Execute xmlns="IAPOS_WS"><Usuario>CONSULTAPDP</Usuario><Passwd>1Qaz</Passwd><Nafiliado>18040813</Nafiliado><Badocnumdo>18040813</Badocnumdo><Tidocodigo_de_documento>96</Tidocodigo_de_documento><Ogorcodigo>1</Ogorcodigo><Fechpresta>${hoy}</Fechpresta></BEWsValidaAfi.Execute></soap:Body></soap:Envelope>`;

const req = https.request(
  "https://aswe.santafe.gov.ar/iapos-sw-srvt/servlet/abewsvalidaafi",
  {
    method: "POST",
    rejectUnauthorized: false,
    timeout: 15000,
    headers: {
      "Content-Type": "text/xml; charset=utf-8",
      SOAPAction: "IAPOS_WSaction/ABEWSVALIDAAFI.Execute",
      "Content-Length": Buffer.byteLength(body),
    },
  },
  (res) => {
    let data = "";
    res.on("data", (c) => (data += c));
    res.on("end", () => {
      console.log("HTTP", res.statusCode);
      console.log(data);
    });
  },
);
req.on("timeout", () => { console.log("TIMEOUT"); req.destroy(); });
req.on("error", (e) => console.log("ERROR:", e.code, e.message));
req.write(body);
req.end();
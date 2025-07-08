import * as fs from 'fs'
import * as path from 'path'

export const directDebitTemplate = (payload: any): string => {
  const periodicidadX = {
    SEMANAL: '70px',
    CATORCENAL: '177px',
    QUINCENAL: '284px',
    MENSUAL: '390px',
    BIMESTRAL: '497px',
    SEMESTRAL: '604px',
    ANUAL: '710px'
  }

  const periodicidadXPos = periodicidadX[(payload.periodicidad as string).toUpperCase()]

  const imagePath = path.join(__dirname, 'domiciliacion_fimubac.jpg')
  const base64Image = fs.readFileSync(imagePath).toString('base64')
  const imageMimeType = 'image/jpeg'

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        p {
          position: fixed;
          color: #000000;
          font-weight: bold;
        }

        @page { size: letter; margin: 0; }
        html, body {
          margin: 0;
          padding: 0;
          width: 100%;
          height: 100%;
        }
        body {
          background: url('data:${imageMimeType};base64,${base64Image}') no-repeat center center;
          background-size: cover;
        }
        .content {
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          box-sizing: border-box;
          color: white;
          font-family: sans-serif;
        }
      </style>
    </head>
    <body>
      <div class="content">
        <p style="top: 157px; left: 76px;">GB PLUS S.A. DE C.V. SOFOM E.N.R.</p>
        <p style="top: 301px; left: 76px;">${payload.banco}</p>

        <p style="top: 621px; left: 56px;">${payload.deudor}</p>
        <p style="top: 476px; left: 490px;">${payload.pagos}</p>

        <p style="top: 998px; left: 50px;">${payload.deudor}</p>

        <div style="top: 570px; left: 480px; width: 160px; position: absolute;">
          <img style="width: 100%; height: auto;" src="${payload.Firmadigitalizada}" />
        </div>

        <p style="top: 252px; left: ${periodicidadXPos};">X</p>

        <p style="top: 358px; left: 445px;">${payload.tokentarjeta01}</p>
        <p style="top: 358px; left: 465px;">${payload.tokentarjeta02}</p>
        <p style="top: 358px; left: 484px;">${payload.tokentarjeta03}</p>
        <p style="top: 358px; left: 503px;">${payload.tokentarjeta04}</p>

        <p style="top: 358px; left: 528px;">${payload.tokentarjeta05}</p>
        <p style="top: 358px; left: 547px;">${payload.tokentarjeta06}</p>
        <p style="top: 358px; left: 567px;">${payload.tokentarjeta07}</p>
        <p style="top: 358px; left: 586px;">${payload.tokentarjeta08}</p>

        <p style="top: 358px; left: 611px;">${payload.tokentarjeta09}</p>
        <p style="top: 358px; left: 630px;">${payload.tokentarjeta10}</p>
        <p style="top: 358px; left: 649px;">${payload.tokentarjeta11}</p>
        <p style="top: 358px; left: 669px;">${payload.tokentarjeta12}</p>

        <p style="top: 358px; left: 694px;">${payload.tokentarjeta13}</p>
        <p style="top: 358px; left: 714px;">${payload.tokentarjeta14}</p>
        <p style="top: 358px; left: 732px;">${payload.tokentarjeta15}</p>
        <p style="top: 358px; left: 752px;">${payload.tokentarjeta16}</p>

        <p style="top: 391px; left: 445px;">${payload.tokenclabe01}</p>
        <p style="top: 391px; left: 465px;">${payload.tokenclabe02}</p>
        <p style="top: 391px; left: 485px;">${payload.tokenclabe03}</p>
        <p style="top: 391px; left: 504px;">${payload.tokenclabe04}</p>
        <p style="top: 391px; left: 524px;">${payload.tokenclabe05}</p>
        <p style="top: 391px; left: 542px;">${payload.tokenclabe06}</p>
        <p style="top: 391px; left: 562px;">${payload.tokenclabe07}</p>
        <p style="top: 391px; left: 582px;">${payload.tokenclabe08}</p>
        <p style="top: 391px; left: 602px;">${payload.tokenclabe09}</p>
        <p style="top: 391px; left: 622px;">${payload.tokenclabe10}</p>
        <p style="top: 391px; left: 642px;">${payload.tokenclabe11}</p>
        <p style="top: 391px; left: 661px;">${payload.tokenclabe12}</p>
        <p style="top: 391px; left: 680px;">${payload.tokenclabe13}</p>
        <p style="top: 391px; left: 699px;">${payload.tokenclabe14}</p>
        <p style="top: 391px; left: 719px;">${payload.tokenclabe15}</p>
        <p style="top: 391px; left: 739px;">${payload.tokenclabe16}</p>
        <p style="top: 391px; left: 758px;">${payload.tokenclabe17}</p>
        <p style="top: 391px; left: 778px;">${payload.tokenclabe18}</p>

        <p style="top: 425px; left: 445px;">${payload.tokentelefono01}</p>
        <p style="top: 425px; left: 465px;">${payload.tokentelefono02}</p>
        <p style="top: 425px; left: 485px;">${payload.tokentelefono03}</p>
        <p style="top: 425px; left: 504px;">${payload.tokentelefono04}</p>
        <p style="top: 425px; left: 524px;">${payload.tokentelefono05}</p>
        <p style="top: 425px; left: 542px;">${payload.tokentelefono06}</p>
        <p style="top: 425px; left: 562px;">${payload.tokentelefono07}</p>
        <p style="top: 425px; left: 582px;">${payload.tokentelefono08}</p>
        <p style="top: 425px; left: 602px;">${payload.tokentelefono09}</p>
        <p style="top: 425px; left: 622px;">${payload.tokentelefono10}</p>

        <div style="top: 944px; left: 480px; width: 160px; position: absolute;">
          <img style="width: 100%; height: auto;" src="${payload.Firmadigitalizada}" />
        </div>
      </div>
    </body>
    </html>
  `
}

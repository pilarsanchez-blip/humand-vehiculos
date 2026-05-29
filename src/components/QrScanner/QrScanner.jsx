import { useEffect, useRef } from 'react'
import { Html5Qrcode } from 'html5-qrcode'
import styles from './QrScanner.module.css'

export function QrScanner({ onResult, onError }) {
  const scannerRef = useRef(null)
  const containerId = 'qr-reader'

  useEffect(() => {
    const scanner = new Html5Qrcode(containerId)
    scannerRef.current = scanner

    scanner.start(
      { facingMode: 'environment' },
      { fps: 10, qrbox: { width: 220, height: 220 } },
      (decodedText) => {
        onResult(decodedText)
        scanner.stop().catch(() => {})
      },
      () => {} // errores de frame — silenciar
    ).catch((err) => {
      onError?.(err)
    })

    return () => {
      scanner.stop().catch(() => {})
    }
  }, [])

  return (
    <div className={styles.wrapper}>
      <div id={containerId} className={styles.reader} />
      <p className={styles.hint}>Apuntá la cámara al QR del ticket</p>
    </div>
  )
}
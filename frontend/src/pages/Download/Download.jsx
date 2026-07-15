import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import NotchedHeroNav from "../../components/layout/NotchedHeroNav";
import logo from "../Home/assets/Images/mugate-logo-3d.png";
import "../Home/Home.css";
import "./Download.css";

const APK_PATH = "/downloads/mugate.apk";
const APK_FILENAME = "MuGate-1.0.0.apk";
const APP_VERSION = "1.0.0";

const INSTALL_STEPS = [
  {
    title: "Download the APK",
    body: "Tap the button above to save MuGate to your Android device.",
  },
  {
    title: "Allow install from this source",
    body: "If prompted, enable installing apps from your browser in Android settings.",
  },
  {
    title: "If you see a warning",
    body:
      "Android or Play Protect may warn that the app is from an unknown source. This is normal for sideloaded APKs. Tap Continue, More details, then Install anyway (or Install) to proceed.",
  },
  {
    title: "Open and install",
    body: "Open the downloaded file and confirm install. MuGate will appear on your home screen.",
  },
];

const Download = () => {
  const navigate = useNavigate();
  const [apkReady, setApkReady] = useState(null); // null = checking, true/false

  useEffect(() => {
    let cancelled = false;
    fetch(APK_PATH, { method: "HEAD" })
      .then((res) => {
        if (!cancelled) setApkReady(res.ok);
      })
      .catch(() => {
        if (!cancelled) setApkReady(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div className="download-page-root">
      <NotchedHeroNav
        maskFrame={false}
        rightSlot={
          <button
            type="button"
            className="nav-demo-btn-solidroad"
            onClick={() => navigate("/")}
          >
            Back{" "}
            <span
              className="circle-arrow-icon"
              style={{
                display: "inline-flex",
                marginLeft: "8px",
                background: "rgba(255, 255, 255, 0.3)",
              }}
            >
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <line x1="19" y1="12" x2="5" y2="12" />
                <polyline points="12 19 5 12 12 5" />
              </svg>
            </span>
          </button>
        }
      />

      <main className="download-hero">
        <div className="download-hero-copy">
          <p className="download-brand">MUGATE</p>
          <h1 className="download-headline">Android app, ready to install</h1>
          <p className="download-lede">
            Take MuGate with you — schedule, chatbot, internships, and more on your phone as an APK.
          </p>

          <div className="download-cta-group">
            {apkReady === false ? (
              <button type="button" className="download-apk-btn" disabled>
                APK not available yet
              </button>
            ) : (
              <a
                className="download-apk-btn"
                href={APK_PATH}
                download={APK_FILENAME}
                aria-disabled={apkReady === null}
              >
                <svg
                  width="22"
                  height="22"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden="true"
                >
                  <path d="M12 3v12" />
                  <path d="m7 10 5 5 5-5" />
                  <path d="M5 21h14" />
                </svg>
                {apkReady === null ? "Checking…" : "Download APK"}
              </a>
            )}
            <span className="download-meta">
              Android · v{APP_VERSION} · Direct install
            </span>
          </div>
        </div>

        <div className="download-device" aria-hidden="true">
          <div className="download-device-frame">
            <div className="download-device-notch" />
            <div className="download-device-screen">
              <img src={logo} alt="" className="download-device-logo" />
              <span className="download-device-name">MuGate</span>
              <span className="download-device-tag">Campus, in your pocket</span>
            </div>
          </div>
        </div>
      </main>

      <section className="download-steps" aria-labelledby="install-heading">
        <h2 id="install-heading" className="download-steps-title">
          How to install
        </h2>
        <p className="download-steps-lede">
          Sideload the APK in a few steps — no Play Store required.
        </p>
        <ol className="download-steps-list">
          {INSTALL_STEPS.map((step, index) => (
            <li key={step.title} className="download-step">
              <span className="download-step-num">{index + 1}</span>
              <div>
                <h3 className="download-step-title">{step.title}</h3>
                <p className="download-step-body">{step.body}</p>
              </div>
            </li>
          ))}
        </ol>
      </section>
    </div>
  );
};

export default Download;

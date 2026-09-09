/** Decorative, resolution-independent artwork; no external image dependency. */
export default function EnergyLandscape() {
  return (
    <svg viewBox="0 0 900 400" preserveAspectRatio="xMidYMid slice" fill="none" aria-hidden="true" focusable="false">
      <defs>
        <linearGradient id="energy-sky" x1="450" y1="0" x2="450" y2="400" gradientUnits="userSpaceOnUse"><stop stopColor="#d7e9df" /><stop offset="1" stopColor="#f2edd2" /></linearGradient>
        <linearGradient id="energy-hill" x1="200" y1="200" x2="700" y2="450" gradientUnits="userSpaceOnUse"><stop stopColor="#759d80" /><stop offset="1" stopColor="#426c5e" /></linearGradient>
        <pattern id="solar-grid" width="29" height="20" patternUnits="userSpaceOnUse"><rect width="29" height="20" fill="#254d50" /><path d="M29 0H0V20" stroke="#82aba5" strokeWidth="1.4" /></pattern>
      </defs>
      <path fill="url(#energy-sky)" d="M0 0h900v400H0z" />
      <circle cx="704" cy="96" r="47" fill="#f4d59c" /><circle cx="704" cy="96" r="64" stroke="#f4d59c" strokeOpacity=".4" />
      <path d="M0 211C138 164 212 218 350 198S574 137 716 174s150 1 184 9v217H0Z" fill="#b6c8a5" />
      <path d="M0 270C163 225 252 255 380 230S630 204 900 249v151H0Z" fill="url(#energy-hill)" />
      <path d="M0 340C225 239 410 352 580 292s246-29 320-7v115H0Z" fill="#315f51" />
      <path d="M425 400c50-42 136-55 205-63 82-10 127-21 162-46" stroke="#a7b992" strokeWidth="7" />
      <g stroke="#f6f6e8" strokeLinecap="round" strokeLinejoin="round">
        <path d="m335 128-5 161h12l-5-161" fill="#f6f6e8" strokeWidth="2" />
        <path d="m335 124-8-88c-1-10 8-11 9 0l3 83M330 130l-71 49c-8 6-12-1-4-7l69-48M341 126l78 36c10 5 6 13-4 8l-78-36" fill="#f6f6e8" strokeWidth="2" />
        <circle cx="334" cy="126" r="8" fill="#c6d7c6" strokeWidth="3" />
        <path d="m574 163-3 92h8l-3-92" fill="#f6f6e8" strokeWidth="2" />
        <path d="m574 160-4-56c-1-7 5-7 6 0l2 51M569 164l-44 31c-6 4-8-1-3-5l43-31M578 161l49 23c7 3 4 8-2 5l-48-24" fill="#f6f6e8" strokeWidth="2" />
        <circle cx="573" cy="160" r="5" fill="#c6d7c6" strokeWidth="2" />
      </g>
      <g transform="translate(83 299) skewX(-23)"><path d="M12 52v14m129-14v14" stroke="#bdcbbb" strokeWidth="4" /><rect width="174" height="58" rx="2" fill="url(#solar-grid)" stroke="#b9cfc1" strokeWidth="3" /></g>
      <path d="m754 321 1-37m-1 18c-18-3-25-15-21-26 13 0 24 10 21 26Zm1-9c16-2 26-14 23-25-15 0-25 11-23 25Z" stroke="#b0c59c" strokeWidth="3" fill="#789e79" />
      <path d="m99 100 10-4 10 4m22-25 8-3 8 3" stroke="#628978" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

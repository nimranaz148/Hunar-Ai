/**
 * Placeholder mascots: flat vector Pakistani women founders in sunglasses, faces fully uncovered.
 * Two looks show the range of everyday style: "hijab" (hijab, kurta) and "dupatta" (hair visible,
 * dupatta draped over the head and shoulders). No bindi, no bun: those read as Indian styling.
 * Swap for the Google Flow artwork by dropping `public/mascots/hero.webp` and passing `src`
 * (see docs/design/hero-prompts.md). Group classes (mascot-head, mascot-shades, mascot-glint) are
 * animation hooks for GSAP.
 */
export type MascotVariant = "hijab" | "dupatta";

const LABEL: Record<MascotVariant, string> = {
  hijab: "Illustration of a smiling Pakistani woman entrepreneur in a hijab and sunglasses",
  dupatta: "Illustration of a smiling Pakistani woman entrepreneur in a dupatta and sunglasses",
};

function Shades() {
  return (
    <g className="mascot-shades">
      <rect x="122" y="238" width="62" height="48" rx="18" fill="#1e1824" stroke="#f4b630" strokeWidth="7" />
      <rect x="216" y="238" width="62" height="48" rx="18" fill="#1e1824" stroke="#f4b630" strokeWidth="7" />
      <path d="M184 256h32" stroke="#f4b630" strokeWidth="7" strokeLinecap="round" />
      <path className="mascot-glint" d="M136 252l18-6M230 252l18-6" stroke="#f4efea" strokeWidth="5" strokeLinecap="round" />
    </g>
  );
}

function Face() {
  return (
    <>
      <ellipse cx="200" cy="258" rx="84" ry="96" fill="#e3a57a" />
      <path d="M138 222q18-10 36 0M226 222q18-10 36 0" fill="none" stroke="#2a0f3a" strokeWidth="6" strokeLinecap="round" />
      <circle cx="146" cy="302" r="13" fill="#ec7fb1" />
      <circle cx="254" cy="302" r="13" fill="#ec7fb1" />
      <path d="M168 310q32 30 64 0" fill="none" stroke="#1e1824" strokeWidth="7" strokeLinecap="round" />
    </>
  );
}

export function Mascot({ className, src, variant = "hijab" }: { className?: string; src?: string; variant?: MascotVariant }) {
  if (src) {
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={src} alt="" className={className} draggable={false} />;
  }

  return (
    <svg viewBox="0 0 400 520" className={className} role="img" aria-label={LABEL[variant]}>
      {/* body: kurta */}
      <path d="M30 520C30 430 96 384 200 384s170 46 170 136Z" fill="#7b3fe4" />
      <path d="M150 400q50 40 100 0" fill="none" stroke="#f4b630" strokeWidth="6" strokeLinecap="round" />

      {variant === "hijab" ? (
        <g className="mascot-head" style={{ transformOrigin: "200px 380px" }}>
          {/* hijab: soft drape over head and shoulders, face fully uncovered */}
          <path d="M84 262C78 138 130 72 200 72s122 66 116 190c-2 52 20 100 52 136-52 22-112 30-168 30S84 420 32 398c32-36 54-84 52-136Z" fill="#cbb2f5" />
          <path d="M108 244C112 168 150 138 200 138s88 30 92 106c-22-40-54-58-92-58s-70 18-92 58Z" fill="#3f1259" />
          <Face />
          <path d="M116 236c14-44 46-62 84-62s70 18 84 62c-20-32-52-46-84-46s-64 14-84 46Z" fill="#3f1259" />
          <circle cx="236" cy="404" r="9" fill="#f4b630" />
          <Shades />
        </g>
      ) : (
        <g className="mascot-head" style={{ transformOrigin: "200px 380px" }}>
          {/* neck */}
          <rect x="168" y="326" width="64" height="72" rx="16" fill="#d9946a" />
          {/* dupatta: loose drape over the back of the head and both shoulders */}
          <path d="M70 280C62 140 124 76 200 76s138 64 130 204c-2 40 16 84 46 118-34 18-62 22-92 8l-30-62-54 0-30 62c-30 14-58 10-92-8 30-34 50-78 42-118Z" fill="#ec7fb1" />
          {/* dark hair, centre parted, framing the face */}
          <path d="M104 262C98 168 140 120 200 120s102 48 96 142c-8-52-40-84-96-84s-88 32-96 84Z" fill="#2a0f3a" />
          <path d="M200 120v54" stroke="#3f1259" strokeWidth="4" strokeLinecap="round" />
          <Face />
          <path d="M116 236c14-44 46-62 84-62s70 18 84 62c-20-32-52-46-84-46s-64 14-84 46Z" fill="#2a0f3a" />
          <circle cx="116" cy="290" r="8" fill="#f4b630" />
          <circle cx="284" cy="290" r="8" fill="#f4b630" />
          <Shades />
        </g>
      )}
    </svg>
  );
}

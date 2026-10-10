"use client";

import { useEffect, useRef, useState } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

interface CountUpProps {
  end: number;
  duration?: number;
  prefix?: string;
  suffix?: string;
  className?: string;
}

export function CountUp({
  end,
  duration = 2,
  prefix = "",
  suffix = "",
  className = "",
}: CountUpProps) {
  const [count, setCount] = useState(0);
  const ref = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    if (!ref.current) return;

    const element = ref.current;
    const obj = { val: 0 };

    const animation = gsap.to(obj, {
      val: end,
      duration,
      ease: "power2.out",
      onUpdate: () => {
        setCount(Math.round(obj.val));
      },
      scrollTrigger: {
        trigger: element,
        start: "top 90%",
        toggleActions: "play none none none",
      },
    });

    return () => {
      animation.kill();
      ScrollTrigger.getAll().forEach((trigger) => {
        if (trigger.trigger === element) {
          trigger.kill();
        }
      });
    };
  }, [end, duration]);

  return (
    <span ref={ref} className={className}>
      {prefix}
      {count}
      {suffix}
    </span>
  );
}

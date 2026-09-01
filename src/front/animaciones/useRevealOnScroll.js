import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import ScrollTrigger from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

export const useRevealOnScroll = (
    targetRef,
    direction = "left",
    options = {}
) => {
    const{
        distance = 120,
        duration = 1,
        delay = 0,
        start = "top 85%",
        once = true
    } = options

    useGSAP(
        () => {
            const element = targetRef.current;

            if (!element){
                return;
            }

            const initialX = direction === "right" ? distance : -distance;

            gsap.from(element, {
                x: initialX,
                opacity: 0,
                duration,
                delay,
                ease: "power3.out",
                scrollTrigger:{
                    trigger: element,
                    start,
                    once,
                }
            })
        },
        {
            dependencies: [direction, distance, duration, delay, start, once],
            scope: targetRef,
            revertOnUpdate: true
        }
    )
}

import { useGSAP } from "@gsap/react";
import gsap from "gsap";

export const useSplitEntrance = (containerRef, options = {}) => {
    const {
        distance = 120,
        duration = 1.3,
        delay = 0.15
    } = options 

    useGSAP(
        () => {
            const container = containerRef.current

            if (!container) {
                return;
            }

            const leftElement = container.querySelector(".split-left")
            const rightElement = container.querySelector(".split-right") 

            if (!leftElement || !rightElement) {
                return
            }

            gsap.from(leftElement, {
                x: -distance,
                opacity: 0,
                duration,
                ease: "power3.out"
            })

            gsap.from(rightElement, {
                x: distance,
                opacity: 0,
                duration,
                ease: "power3.out"
            })
        }, {
            scope: containerRef,
            dependencies: [distance, duration, delay],
            revertOnUpdate: true,
        }
    )
}
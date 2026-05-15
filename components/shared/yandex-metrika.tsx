"use client";

import { useEffect } from "react";
import { ymGoal } from "@/lib/ym";

const YM_ID = process.env.NEXT_PUBLIC_YANDEX_METRIKA_ID;

export function YandexMetrika() {
  useEffect(() => {
    // Global CTA click tracking via data-event delegation
    function handleClick(e: MouseEvent) {
      const target = (e.target as HTMLElement).closest("[data-event]");
      if (!target) return;
      const eventName = target.getAttribute("data-event") ?? "";
      const params: Record<string, string> = {};
      for (const attr of Array.from(target.attributes)) {
        if (attr.name.startsWith("data-") && attr.name !== "data-event") {
          params[attr.name.slice(5)] = attr.value;
        }
      }
      ymGoal(eventName, params);
    }
    document.addEventListener("click", handleClick);
    return () => document.removeEventListener("click", handleClick);
  }, []);

  if (!YM_ID) return null;

  const id = Number(YM_ID);
  const initScript = `(function(m,e,t,r,i,k,a){m[i]=m[i]||function(){(m[i].a=m[i].a||[]).push(arguments)};m[i].l=1*new Date();for(var j=0;j<document.scripts.length;j++){if(document.scripts[j].src===r){return;}}k=e.createElement(t),a=e.getElementsByTagName(t)[0],k.async=1,k.src=r,a.parentNode.insertBefore(k,a)})(window,document,"script","https://mc.yandex.ru/metrika/tag.js","ym");ym(${id},"init",{clickmap:true,trackLinks:true,accurateTrackBounce:true,webvisor:true});`;

  return (
    <>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <noscript><img src={`https://mc.yandex.ru/watch/${id}`} style={{ position: "absolute", left: "-9999px" }} alt="" /></noscript>
      <script dangerouslySetInnerHTML={{ __html: initScript }} />
    </>
  );
}

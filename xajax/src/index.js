const xParser = new DOMParser()

export default function (Alpine) {
    Alpine.directive(
      "ajax",
      async (el, { expression, modifiers }, { effect, evaluateLater }) => {
        let target = evaluateLater(expression);
        let query

        if (modifiers.includes('query')) query = modifiers[(modifiers.indexOf(modifiers.includes('class')?'class':'query')+1)]
        if (modifiers.includes('class')) query = "."+query

        effect(()=>{
            target(async (target) => {
            let response = await (await fetch(target, { mode: "no-cors" })).text();
            let doc = xParser.parseFromString(response, "text/html")
            let selector = query?(modifiers.includes('all')?doc.body.querySelectorAll(query):doc.body.querySelector(query)):doc.body
            if(!selector) return

            if(modifiers.includes('replace')) return el.replaceWith(selector)
            if(modifiers.includes('all')) return el.replaceChildren(...selector)
            if(selector.tagName=='BODY') return el.replaceChildren(...selector.children)
            return el.replaceChildren(selector)
        })});
      }
    );
}
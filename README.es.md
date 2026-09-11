<!-- Built from data/prompts.json and locales/es.json by `node scripts/build.mjs`.
     Edit the source, not this file; `--check` fails CI on a hand edit. -->

<p align="center" dir="ltr">
  <a href="README.md">English</a> ·
  <a href="README.zh.md">中文</a> ·
  <strong>Español</strong> ·
  <a href="README.ja.md">日本語</a> ·
  <a href="README.ar.md">العربية</a> ·
  <a href="README.pt.md">Português</a>
</p>

# Prompts de GPT Image 2.5

<p align="center"><img src="images/examples/travel.webp" alt="Awesome GPT Image 2.5 prompts — cinematic image example generated on YouArt" width="960"></p>

[![License](https://img.shields.io/badge/license-see%20LICENSE-blue.svg)](LICENSE)
[![PRs welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg)](CONTRIBUTING.md)
[![verify](https://github.com/youart-open-source/awesome-gpt-image-2-5-prompts/actions/workflows/verify.yml/badge.svg)](https://github.com/youart-open-source/awesome-gpt-image-2-5-prompts/actions/workflows/verify.yml)
![Prompts](https://img.shields.io/badge/prompts-150-111111.svg)

150 prompts listos para producción para los modelos GPT Image de OpenAI, incluido GPT Image 2.5. Cada uno se reproduce literalmente tal como lo publicó su autor, con su cuenta y un enlace a la publicación de la que salió.

150 prompts · 110 creadores acreditados · 9 casos de uso · 25 escritos en JSON · actualizado el 2026-09-10

**[Abrir el generador](https://youart.ai/es/gpt-image-2-5-prompts?utm_source=github&utm_medium=hero&utm_campaign=awesome-gpt-image-2-5-prompts&utm_content=hero)**

GPT, GPT Image y ChatGPT son marcas comerciales de OpenAI. YouArt es una plataforma independiente y no está afiliada a OpenAI ni cuenta con su respaldo. GPT Image 2.5 todavía se está desplegando y aún no está abierto a todas las cuentas; cuando se abra, estos prompts pasarán sin cambios.

<a id="what"></a>

## Qué es esto

Una biblioteca curada y acreditada de prompts que otras personas publicaron después de ejecutarlos en los modelos GPT Image de OpenAI. Están agrupados por lo que quieres hacer, no por estilo, porque esa es la forma que tiene la demanda. Cada prompt conserva su redacción original, su autor y un enlace a la publicación de la que salió.

De dónde salieron, sin adornos: las publicaron en X las 110 personas acreditadas aquí, y las recopilaron dos repositorios de código abierto de los que partimos. 144 de las 149 publicaciones con fecha son anteriores al lanzamiento de GPT Image 2.5 el 2026-09-08. Son prompts en lenguaje natural, no sintaxis propia de un modelo, así que un prompt escrito para GPT Image 2 funciona igual en 2.5. Preferimos decirlo así antes que disfrazar una biblioteca de la época de GPT Image 2 como si fuera nativa de 2.5, y no afirmamos que nadie de aquí los haya ejecutado en 2.5.

<a id="how"></a>

## Cómo usarla

1. Elige un caso de uso abajo y abre su archivo.
2. Copia el prompt entero del bloque de código. No lo parafrasees: las cadenas entre comillas están ahí para que el modelo las dibuje literalmente.
3. Cambia las partes que deban ser tuyas: el sujeto, el texto, la paleta. Y ejecútalo.

56 de estos prompts conservan los marcadores de plantilla que su autor escribió entre llaves. Sustituye cada uno por tu propio valor antes de ejecutar el prompt, o el modelo dibujará el marcador como texto.

<a id="browse"></a>

## Explorar por caso de uso

Los prompts no se traducen. Se quedan con las palabras que escribió su autor, porque un prompt es una entrada para el modelo y no un texto para leer: la capacidad estrella de este modelo es dibujar la cadena entrecomillada tal cual, y traducirla cambia el resultado.

- **[Carteles](https://youart.ai/es/gpt-image-2-5-prompts?utm_source=github&utm_medium=category&utm_campaign=awesome-gpt-image-2-5-prompts&utm_content=poster#poster)** — Teasers de películas, flyers de eventos, carteles de viaje y portadas de disco. Estos prompts dedican casi toda su extensión a la composición, porque un cartel es un problema de maquetación antes que de estilo: dónde va el título, cuánto espacio en blanco queda por encima y qué ocupa el tercio inferior. [Abrir los 17 prompts](prompts/gpt-image-2-5-poster-prompts.md)
- **[Texto en la imagen](https://youart.ai/es/gpt-image-2-5-prompts?utm_source=github&utm_medium=category&utm_campaign=awesome-gpt-image-2-5-prompts&utm_content=typography-text#typography-text)** — Escribir palabras legibles dentro de la imagen es la capacidad por la que se conoce a esta generación del modelo. Estos prompts citan la cadena exacta que hay que dibujar, describen el carácter de la tipografía y colocan el texto en el encuadre en lugar de confiar en la suerte. [Abrir los 17 prompts](prompts/gpt-image-2-5-text-in-image-prompts.md)
- **[Infografías](https://youart.ai/es/gpt-image-2-5-prompts?utm_source=github&utm_medium=category&utm_campaign=awesome-gpt-image-2-5-prompts&utm_content=infographic#infographic)** — Gráficas, cronologías, vistas explotadas y diapositivas explicativas. Los más largos se leen casi como una especificación: cuántas llamadas, en qué lado y con qué texto de etiqueta. Esa es la razón de que funcionen, y también de que muchos estén escritos en JSON. [Abrir los 17 prompts](prompts/gpt-image-2-5-infographic-prompts.md)
- **[Maquetas de UI](https://youart.ai/es/gpt-image-2-5-prompts?utm_source=github&utm_medium=category&utm_campaign=awesome-gpt-image-2-5-prompts&utm_content=ui-mockup#ui-mockup)** — Paneles de control, pantallas móviles, páginas de aterrizaje y overlays de directo. Un prompt de UI tiene que nombrar sus componentes, porque el modelo se inventará una interfaz plausible si no le dices cuál tenías en mente. [Abrir los 17 prompts](prompts/gpt-image-2-5-ui-mockup-prompts.md)
- **[Fotos de producto](https://youart.ai/es/gpt-image-2-5-prompts?utm_source=github&utm_medium=category&utm_campaign=awesome-gpt-image-2-5-prompts&utm_content=ecommerce-product#ecommerce-product)** — Fotos de producto en estudio, renders de packaging e imágenes de catálogo. Son los prompts que se amortizan solos: describen un esquema de luz, una superficie y una posición de cámara con la precisión suficiente para repetirlos en toda una línea de producto. [Abrir los 17 prompts](prompts/gpt-image-2-5-product-photo-prompts.md)
- **[Creatividades](https://youart.ai/es/gpt-image-2-5-prompts?utm_source=github&utm_medium=category&utm_campaign=awesome-gpt-image-2-5-prompts&utm_content=ad-creative#ad-creative)** — Key visuals de campaña, banners y creatividades para redes. La mayoría llevan a la vez una dirección de imagen y un texto que hay que dibujar, y por eso pertenecen a este modelo y no a una generación que no sabía deletrear. [Abrir los 17 prompts](prompts/gpt-image-2-5-ad-creative-prompts.md)
- **[Diseño de personajes](https://youart.ai/es/gpt-image-2-5-prompts?utm_source=github&utm_medium=category&utm_campaign=awesome-gpt-image-2-5-prompts&utm_content=character-design#character-design)** — Hojas de rotación, rejillas de expresiones, desgloses de equipo y mascotas. El patrón útil aquí es pedir una hoja en lugar de una imagen: varias vistas de un mismo personaje en una sola imagen, que es la forma de conseguir un diseño que puedas seguir usando. [Abrir los 16 prompts](prompts/gpt-image-2-5-character-design-prompts.md)
- **[Retratos](https://youart.ai/es/gpt-image-2-5-prompts?utm_source=github&utm_medium=category&utm_campaign=awesome-gpt-image-2-5-prompts&utm_content=portrait#portrait)** — Retratos editoriales, fotos de perfil y fotografía con aspecto de película. Estos viven o mueren por la dirección de cámara: el formato, la distancia focal, la fuente de luz y el etalonaje hacen más trabajo que cualquier adjetivo sobre la atmósfera. [Abrir los 16 prompts](prompts/gpt-image-2-5-portrait-prompts.md)
- **[Ilustración](https://youart.ai/es/gpt-image-2-5-prompts?utm_source=github&utm_medium=category&utm_campaign=awesome-gpt-image-2-5-prompts&utm_content=illustration#illustration)** — Anime, acuarela, line art, render 3D, isométrico y pixel art. Los prompts de estilo son los más cortos de la biblioteca y los que más merece la pena editar: cambia el sujeto, conserva la cláusula de estilo y ya tienes una serie. [Abrir los 16 prompts](prompts/gpt-image-2-5-illustration-prompts.md)

<a id="guide"></a>

## Cómo escribir un prompt para GPT Image 2.5

Seis patrones que se repiten una y otra vez en toda la biblioteca. No son reglas sobre cómo redactar; son decisiones que el modelo tomará por ti si no las tomas tú, y la diferencia entre un prompt que funciona una vez y otro que puedes reutilizar.

### Nombra la pieza, no el tema

Empieza por lo que ES el resultado terminado. «Un cartel teaser de película en 16:9» y «una escena cinematográfica de una mujer en una sala» producen imágenes distintas a partir de la misma descripción, porque el primero se compromete con un formato, un propósito y un conjunto de convenciones. Casi todos los prompts de esta biblioteca empiezan así.

### Fija la composición antes que el estilo

Di dónde va cada cosa: en qué tercio está el sujeto, qué llena la cabecera, cuántos paneles hay, qué ocupa la banda inferior. Los adjetivos de estilo son baratos de cambiar después; una composición que no especificaste es justo lo que acabarás regenerando cinco veces para intentar arreglarla.

### Pon las palabras exactas entre comillas

Si una cadena tiene que aparecer en la imagen, escríbela entre comillas y di dónde va. Describirla («un título en negrita abajo») te dará un título en negrita con las palabras equivocadas. Este modelo sabe deletrear, así que el fallo ya no son los glifos ilegibles, sino un texto que no pediste.

### Dirige la cámara, no solo la escena

Formato, ángulo, distancia focal, fuente de luz y etalonaje. «Película de 35 mm, flash frontal duro, contrapicado en tres cuartos» es una especificación. «Cinematográfico, con atmósfera» es un deseo. Esta es la mayor diferencia entre los prompts de retrato que se reproducen y los que no.

### Limita la paleta

Tres o cuatro colores con nombre valen más que cualquier palabra sobre la atmósfera. Es también lo que convierte un prompt en una plantilla reutilizable: un prompt de cartel de viaje que dice «las ciudades costeras usan aguamarina, coral y crema; las de montaña, azul alpino y blanco nieve» se convierte en una serie en lugar de en una sola imagen.

### Di qué no debe aparecer

Una lista corta de exclusiones al final hace trabajo de verdad: sin marca de agua, sin texto de más, sin sol visible en la esquina, sin piel de plástico. Mantenla breve y concreta. Una lista larga de negativos empieza a competir con la descripción por la atención del modelo.

### Para editar, nombra el cambio antes que las restricciones

Describe lo único que debe cambiar y después enumera lo que tiene que sobrevivir a ese cambio: sujeto, pose, ángulo de cámara, iluminación, fondo, estilo. Invertir ese orden entierra la instrucción, y pedir tres cambios a la vez te deja sin saber cuál movió el resultado. Ajusta el elemento nuevo a la perspectiva, las sombras y la textura del original, o la edición se leerá como algo pegado encima.

### Di para qué sirve una imagen de referencia

Este modelo admite hasta dieciséis imágenes de referencia, y "imita esto" no es una instrucción. Nombra lo que aporta la referencia: el sujeto, la silueta, la paleta de color, la disposición, el material, y qué debe trasladarse a la nueva imagen. Después describe el escenario o el cambio que de verdad quieres, que la referencia no contiene.

### Varía una cosa, no todas

Mantén constante el producto, el personaje o el mensaje y cambia una sola variable: dos direcciones de luz, dos composiciones, dos estilos. Comparar un conjunto que se diferencia en un solo aspecto te dice qué decisión hizo el trabajo; comparar cuatro imágenes sin relación entre sí no te dice nada. Guarda los prompts que se reproducen: esos se convierten en la plantilla de la próxima campaña.

<a id="rights"></a>

## Licencia y crédito

Los scripts de build tienen licencia MIT. La curación, el texto original, las traducciones y las imágenes de ejemplo generadas por YouArt tienen licencia CC BY 4.0: se pueden reutilizar, adaptar y usar comercialmente con atribución.

Los prompts y sus títulos siguen siendo obra de sus autores. ATTRIBUTION.md conserva para cada fila el autor, la publicación original y los términos declarados por la colección de origen — CC0 1.0 o CC BY 4.0. No otorgamos derechos adicionales sobre obras de terceros.

¿Escribiste alguno y quieres que salga? Dilo y sale, sin explicaciones.

[`LICENSE`](LICENSE) · [`ATTRIBUTION.md`](ATTRIBUTION.md) · [`TAKEDOWN.md`](TAKEDOWN.md)

<a id="json"></a>

## El formato de prompt en JSON

Algunos de los prompts de esta biblioteca son un objeto JSON en lugar de una frase. No se trata de un modo especial de la API ni de una función oculta: el modelo lo lee como texto, igual que todo lo demás. Lo que aporta la estructura es precisión, y una edición más fácil.

Recurre a él cuando la imagen tenga partes que deban mantenerse separadas: una cabecera, una pieza central, un conjunto numerado de llamadas y un pie. La prosa las mezcla y el modelo tiene que adivinar la jerarquía. Las claves las mantienen aparte y convierten el prompt en una plantilla, porque cambiar un valor no obliga a reescribir la frase que lo rodea. Para un retrato o una ilustración de un solo sujeto, la prosa es más corta y funciona igual de bien.

<a id="faq"></a>

## Preguntas frecuentes sobre los prompts de GPT Image 2.5

### ¿Funcionan los prompts de GPT Image 2 con GPT Image 2.5?

Sí. Son prompts en lenguaje natural, no una sintaxis propia de un modelo, así que un prompt escrito para GPT Image 2 funciona sin cambios en 2.5 y suele volver más nítido. Por eso esta biblioteca sirve desde el primer día: la técnica de prompting se mantuvo aunque cambiara el modelo.

### ¿Conviene escribir los prompts en JSON o en prosa?

Prosa para todo lo que tenga un solo sujeto: un retrato, una ilustración, una foto de producto. JSON en cuanto la imagen tiene partes que deben quedar bien diferenciadas, como una cabecera, un conjunto numerado de llamadas y un pie. El modelo trata ambos como texto, así que JSON no es un modo especial. Es una forma de que una composición compleja no quede ambigua y de convertir el prompt en una plantilla que puedes editar valor a valor.

### ¿Cómo consigo que el texto salga bien dentro de la imagen?

Escribe la cadena exacta entre comillas y di en qué parte del encuadre va; después describe el carácter de la tipografía que quieres en lugar de una fuente concreta. Describir el texto en vez de citarlo es la causa habitual de que salga casi bien, pero no del todo. Esta generación del modelo dibuja muy bien el texto dentro de la imagen, incluidos el chino y el japonés, así que la mayoría de los fallos que quedan vienen de un prompt poco preciso y no de la ortografía del modelo.

### ¿Cómo mantengo el mismo personaje en varias imágenes?

Pide una hoja de personaje en una sola imagen en lugar de varias imágenes de un mismo personaje. Un prompt que pide vistas frontal, lateral y trasera, más una fila de expresiones y un desglose del equipo, te deja una única referencia con la que trabajar, que es el patrón que usan los prompts de diseño de personajes de esta biblioteca. Las imágenes de referencia son la otra mitad: el modelo acepta varias, y volver a darle la hoja mantiene el diseño estable.

### ¿Puedo ejecutar estos prompts en YouArt?

Sí. Copia cualquier prompt en GPT Image 2, el modelo de imagen de OpenAI que YouArt ofrece hoy, y funcionará tal cual. GPT Image 2.5 todavía se está desplegando y aún no está abierto a todas las cuentas; cuando se abra, estos prompts pasarán sin cambios.

### ¿Cómo debo escribir prompts de GPT Image 2.5 para editar?

Describe primero el único cambio que buscas y después nombra los detalles que hay que conservar: el sujeto, la pose, la iluminación, el ángulo de cámara y cualquier detalle del producto que no deba moverse. Revisar después de cada versión hace que cada cambio sea atribuible a algo que pediste, cosa que un lote de ediciones simultáneas no permite.

### ¿Puedo usar una imagen de referencia con los prompts de GPT Image 2.5?

Sí, y el modelo admite hasta dieciséis. Di qué aporta la referencia en lugar de pedir que la imite: un sujeto, una silueta, una paleta de color, una composición, un material. Después identifica los rasgos que deben trasladarse y describe el nuevo escenario o el cambio que quieres sobre ellos.

### ¿Conviene un prompt largo o varias revisiones?

Empieza con un brief completo para la primera imagen y después usa revisiones puntuales para las partes que necesiten trabajo. Eso protege lo que ya funcionaba y hace que cada resultado sea comparable con el anterior. Trata la composición, la iluminación, el texto y el estilismo como revisiones separadas cuando cada uno necesite atención.

### ¿Cómo escribo prompts para un generador de imágenes con IA?

Escribe en el orden en que quien mira percibe la imagen: sujeto, escenario, composición, estilo, iluminación y, por último, los detalles que deben mantenerse constantes. Si el resultado lleva texto, una maquetación o información de producto, indica la redacción exacta y di dónde encaja en la jerarquía visual en lugar de describirla.

<a id="machines"></a>

## Para LLM y agentes

GitHub entrega el texto completo de los prompts a un rastreador que no renderiza en la página de un archivo, pero no en la portada del repositorio. Por eso las copias legibles por máquina se listan aquí, con su tamaño.

| Contenido | Archivo | Bytes |
|---|---|--:|
| Todos los prompts | [`data/prompts.json`](https://raw.githubusercontent.com/youart-open-source/awesome-gpt-image-2-5-prompts/main/data/prompts.json) | 496,998 |
| Para LLM y agentes | [`llms.txt`](https://raw.githubusercontent.com/youart-open-source/awesome-gpt-image-2-5-prompts/main/llms.txt) | 11,022 |
| Carteles | [`prompts/gpt-image-2-5-poster-prompts.md`](https://raw.githubusercontent.com/youart-open-source/awesome-gpt-image-2-5-prompts/main/prompts/gpt-image-2-5-poster-prompts.md) | 60,016 |
| Texto en la imagen | [`prompts/gpt-image-2-5-text-in-image-prompts.md`](https://raw.githubusercontent.com/youart-open-source/awesome-gpt-image-2-5-prompts/main/prompts/gpt-image-2-5-text-in-image-prompts.md) | 38,349 |
| Infografías | [`prompts/gpt-image-2-5-infographic-prompts.md`](https://raw.githubusercontent.com/youart-open-source/awesome-gpt-image-2-5-prompts/main/prompts/gpt-image-2-5-infographic-prompts.md) | 70,351 |
| Maquetas de UI | [`prompts/gpt-image-2-5-ui-mockup-prompts.md`](https://raw.githubusercontent.com/youart-open-source/awesome-gpt-image-2-5-prompts/main/prompts/gpt-image-2-5-ui-mockup-prompts.md) | 41,745 |
| Fotos de producto | [`prompts/gpt-image-2-5-product-photo-prompts.md`](https://raw.githubusercontent.com/youart-open-source/awesome-gpt-image-2-5-prompts/main/prompts/gpt-image-2-5-product-photo-prompts.md) | 45,681 |
| Creatividades | [`prompts/gpt-image-2-5-ad-creative-prompts.md`](https://raw.githubusercontent.com/youart-open-source/awesome-gpt-image-2-5-prompts/main/prompts/gpt-image-2-5-ad-creative-prompts.md) | 60,933 |
| Diseño de personajes | [`prompts/gpt-image-2-5-character-design-prompts.md`](https://raw.githubusercontent.com/youart-open-source/awesome-gpt-image-2-5-prompts/main/prompts/gpt-image-2-5-character-design-prompts.md) | 50,346 |
| Retratos | [`prompts/gpt-image-2-5-portrait-prompts.md`](https://raw.githubusercontent.com/youart-open-source/awesome-gpt-image-2-5-prompts/main/prompts/gpt-image-2-5-portrait-prompts.md) | 54,404 |
| Ilustración | [`prompts/gpt-image-2-5-illustration-prompts.md`](https://raw.githubusercontent.com/youart-open-source/awesome-gpt-image-2-5-prompts/main/prompts/gpt-image-2-5-illustration-prompts.md) | 58,486 |

La dirección convencional para un índice destinado a asistentes es el llms.txt del propio sitio, que ya incluye esta biblioteca. La copia de este repositorio es un espejo de esa sección. [`llms.txt`](llms.txt)

Si citas un prompt, lleva contigo su autor y el enlace a la publicación original.

<a id="cta"></a>

## Ejecuta cualquiera de estos prompts

Copia un prompt, pégalo en el compositor y cambia las partes que deban ser tuyas. Sin configuración, y con créditos gratis para empezar.

**[Abrir el generador](https://youart.ai/es/gpt-image-2-5-prompts?utm_source=github&utm_medium=footer&utm_campaign=awesome-gpt-image-2-5-prompts&utm_content=footer)** · [Ver los 150 prompts en youart.ai](https://youart.ai/es/gpt-image-2-5-prompts?utm_source=github&utm_medium=footer&utm_campaign=awesome-gpt-image-2-5-prompts&utm_content=footer)

<a id="about"></a>

## Acerca de

Mantenido por YouArt, un producto de Formative Intelligence Inc.

YouArt es un estudio de imagen y vídeo con IA. Los 150 prompts también están en el sitio, con un compositor de un clic, así que puedes ejecutar cualquiera sin configurar nada. Con créditos gratis para empezar.

[youart.ai](https://youart.ai/es/?utm_source=github&utm_medium=footer&utm_campaign=awesome-gpt-image-2-5-prompts&utm_content=brand)

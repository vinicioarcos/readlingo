/* Glosas básicas EN→ES redactadas para ReadLingo. No analizan el contexto.
 * Las formas flexionadas se incluyen expresamente; no se adivinan raíces.
 * No se incluye IPA cuando no hay una transcripción verificada. */
(function (root) {
  'use strict';
  const rows = `
a|un; una
an|un; una
the|el; la; los; las
and|y
or|o
but|pero
if|si (condición)
because|porque
although|aunque
while|mientras
when|cuando
where|donde
why|por qué
how|cómo
what|qué; lo que
which|cuál; que
who|quién; que (persona)
whose|de quién; cuyo
whom|a quién
that|ese; esa; que
this|este; esta
these|estos; estas
those|esos; esas
i|yo
you|tú; usted; ustedes
he|él
she|ella
it|ello; eso
we|nosotros; nosotras
they|ellos; ellas
me|me; a mí
him|lo; a él
her|la; a ella; su (de ella)
us|nos; a nosotros
them|los; las; a ellos
my|mi
your|tu; su
his|su (de él)
its|su (de ello)
our|nuestro; nuestra
their|su (de ellos)
mine|mío; mía; mina
yours|tuyo; suyo
ours|nuestro; nuestra
theirs|suyo (de ellos)
myself|yo mismo; yo misma
yourself|tú mismo; usted mismo
himself|él mismo
herself|ella misma
itself|sí mismo
ourselves|nosotros mismos
themselves|ellos mismos
all|todo; todos
some|algunos; algo de
any|cualquier; alguno
every|cada; todo
each|cada
both|ambos; ambas
either|cualquiera de los dos
neither|ninguno de los dos
other|otro; otra
another|otro; otra más
many|muchos; muchas
much|mucho
few|pocos; pocas
little|pequeño; poco
more|más
most|la mayoría; el más
less|menos
enough|suficiente
several|varios; varias
no|no; ningún
not|no
yes|sí
never|nunca
always|siempre
often|a menudo
sometimes|a veces
usually|normalmente
again|otra vez
already|ya
still|todavía; quieto
yet|todavía; aún
just|justo; solamente; recién
only|solamente; único
also|también
too|también; demasiado
very|muy
quite|bastante
almost|casi
perhaps|quizá
maybe|tal vez
really|realmente
even|incluso; uniforme; par (número)
ever|alguna vez
here|aquí
there|allí
now|ahora
then|entonces; luego
soon|pronto
today|hoy
yesterday|ayer
tomorrow|mañana (día siguiente)
before|antes; delante de
after|después; detrás de
during|durante
until|hasta
since|desde; ya que
for|para; por; durante
from|de; desde
to|a; hacia; para
of|de
with|con
without|sin
in|en; dentro de
on|sobre; en
at|en; a
by|por; junto a
about|acerca de; aproximadamente
between|entre dos
among|entre varios
under|debajo de
over|encima de; más de
above|por encima de
below|debajo de
behind|detrás de
beside|al lado de
near|cerca de
far|lejos; lejano
inside|dentro; interior
outside|fuera; exterior
through|a través de
across|al otro lado de; cruzando
around|alrededor de
along|a lo largo de
against|contra
towards|hacia
toward|hacia
up|arriba
down|abajo
away|lejos; fuera
back|atrás; espalda
forward|hacia delante
be|ser; estar
am|soy; estoy
is|es; está
are|son; están; eres
was|era; estaba; fue
were|eran; estaban; fueron
been|sido; estado
being|siendo; estando; ser
have|tener; haber
has|tiene; ha
had|tenía; tuvo; había
having|teniendo
do|hacer
does|hace
did|hizo; hizo (auxiliar de pasado)
done|hecho
doing|haciendo
can|poder; lata
could|podía; podría
may|puede; quizá; mayo
might|podría; fuerza
must|deber; tener que
should|debería
would|auxiliar de condicional; haría
will|auxiliar de futuro; voluntad
shall|auxiliar de futuro o propuesta
go|ir
goes|va
went|fue; se fue
gone|ido; ausente
going|yendo
come|venir
comes|viene
came|vino
coming|viniendo
get|obtener; llegar; volverse
gets|obtiene; llega
got|obtuvo; llegó
getting|obteniendo; llegando
make|hacer; fabricar
makes|hace; fabrica
made|hecho; fabricó
making|haciendo; fabricando
take|tomar; llevar
takes|toma; lleva
took|tomó; llevó
taken|tomado; llevado
taking|tomando; llevando
give|dar
gives|da
gave|dio
given|dado
giving|dando
say|decir
says|dice
said|dijo; dicho
saying|diciendo; dicho popular
tell|decir; contar
tells|dice; cuenta
told|dijo; contó
telling|contando; diciendo
ask|preguntar; pedir
asks|pregunta; pide
asked|preguntó; pidió
asking|preguntando; pidiendo
answer|respuesta; responder
answered|respondió
know|saber; conocer
knows|sabe; conoce
knew|sabía; conocía
known|sabido; conocido
knowing|sabiendo; conociendo
think|pensar
thinks|piensa
thought|pensó; pensamiento
thinking|pensando
see|ver
sees|ve
saw|vio (pasado de see); sierra
seen|visto
seeing|viendo
look|mirar; aspecto
looks|mira; aspecto
looked|miró
looking|mirando
watch|mirar con atención; reloj
watched|miró; vigiló
hear|oír
heard|oyó; oído
hearing|oyendo; audición
listen|escuchar
listened|escuchó
listening|escuchando
speak|hablar
speaks|habla
spoke|habló
spoken|hablado
speaking|hablando
read|leer; leyó; leído
reads|lee
reading|leyendo; lectura
write|escribir
writes|escribe
wrote|escribió
written|escrito
writing|escribiendo; escritura
draw|dibujar; sacar; empate
drew|dibujó; sacó
drawn|dibujado; sacado
drawing|dibujo; dibujando
drawings|dibujos
find|encontrar
finds|encuentra
found|encontró; encontrado
finding|encontrando; hallazgo
leave|dejar; salir
leaves|hojas; deja; sale
left|izquierda; dejó; se fue (pasado de leave)
leaving|dejando; saliendo
keep|guardar; mantener
kept|guardó; mantuvo
keeping|guardando; manteniendo
put|poner; puso; puesto
puts|pone
putting|poniendo
bring|traer
brought|trajo; traído
bringing|trayendo
buy|comprar
bought|compró; comprado
sell|vender
sold|vendió; vendido
want|querer
wants|quiere
wanted|quería; quiso
need|necesitar; necesidad
needed|necesitó
like|gustar; como; parecido a
likes|gusta; gustos
liked|gustó
love|amor; amar
loved|amó; amado
loving|amoroso; amando
feel|sentir
feels|siente
felt|sintió; fieltro
feeling|sentimiento; sintiendo
seem|parecer
seemed|parecía
become|convertirse; llegar a ser
became|se convirtió
begin|empezar
began|empezó
begun|empezado
beginning|comienzo; empezando
start|empezar; comienzo
started|empezó
stop|parar; parada
stopped|paró
finish|terminar; final
finished|terminó; terminado
try|intentar; intento
tried|intentó
trying|intentando
help|ayudar; ayuda
helped|ayudó
work|trabajar; trabajo
worked|trabajó
working|trabajando
play|jugar; tocar; obra teatral
played|jugó; tocó
playing|jugando; tocando
live|vivir; en directo
lived|vivió
living|viviendo; vivo
die|morir; dado de juego
died|murió
dying|muriendo
sleep|dormir; sueño
slept|durmió
sleeping|durmiendo
wake|despertar
woke|despertó
woken|despertado
eat|comer
ate|comió
eaten|comido
drink|beber; bebida
drank|bebió
drunk|bebido; borracho
walk|caminar; paseo
walked|caminó
walking|caminando
run|correr; dirigir
ran|corrió
running|corriendo
sit|sentarse
sat|se sentó
sitting|sentado; sentándose
stand|estar de pie; puesto
stood|estuvo de pie
standing|de pie
fall|caer; otoño
fell|cayó
fallen|caído
falling|cayendo
rise|levantarse; aumentar
rose|rosa; se levantó (pasado de rise)
risen|levantado; aumentado
rising|subiendo; aumentando
fly|volar; mosca
flew|voló
flown|volado
flying|volando
drive|conducir; impulso
drove|condujo
driven|conducido
ride|montar; paseo
rode|montó
ridden|montado
hold|sostener; agarrar
held|sostuvo
holding|sosteniendo
meet|conocer; reunirse
met|conoció; se reunió
remember|recordar
remembered|recordó
forget|olvidar
forgot|olvidó
forgotten|olvidado
understand|entender
understood|entendió; entendido
learn|aprender
learned|aprendió; aprendido
teach|enseñar
taught|enseñó; enseñado
open|abrir; abierto
opened|abrió
close|cerrar; cercano
closed|cerró; cerrado
turn|girar; turno
turned|giró; se volvió
move|mover; mudarse
moved|movió; se mudó
wait|esperar
waited|esperó
stay|quedarse; estancia
stayed|se quedó
follow|seguir
followed|siguió
reach|alcanzar
reached|alcanzó
return|volver; devolver; regreso
returned|volvió; devolvió
change|cambiar; cambio
changed|cambió
believe|creer
believed|creyó
hope|esperanza; esperar con deseo
hoped|esperó con deseo
wish|deseo; desear
wished|deseó
smile|sonrisa; sonreír
smiled|sonrió
laugh|reír; risa
laughed|rió
cry|llorar; gritar
cried|lloró; gritó
shout|gritar; grito
shouted|gritó
whisper|susurrar; susurro
whispered|susurró
explain|explicar
explained|explicó
swallow|tragar; golondrina
swallowed|tragó; tragado
tame|domesticar; manso
tamed|domesticó; domesticado
protect|proteger
protected|protegió
water|agua; regar
watered|regó
grow|crecer; cultivar
grew|creció
grown|crecido; cultivado
grown-up|adulto
grown-ups|adultos
one|uno
two|dos
three|tres
four|cuatro
five|cinco
six|seis
seven|siete
eight|ocho
nine|nueve
ten|diez
eleven|once
twelve|doce
twenty|veinte
hundred|cien; ciento
thousand|mil
first|primero
second|segundo
third|tercero
last|último; durar
next|siguiente
time|tiempo; vez
times|veces; tiempos
day|día
days|días
night|noche
nights|noches
morning|mañana (parte del día)
afternoon|tarde
evening|tarde; noche temprana
week|semana
month|mes
year|año
years|años
hour|hora
minute|minuto; diminuto
moment|momento
life|vida
world|mundo
earth|tierra; planeta Tierra
sky|cielo
sun|sol
moon|luna
star|estrella
stars|estrellas
planet|planeta
planets|planetas
sunset|puesta de sol
sunrise|amanecer
cloud|nube
rain|lluvia; llover
wind|viento; dar cuerda
snow|nieve
storm|tormenta
fire|fuego; despedir
light|luz; ligero
dark|oscuro
darkness|oscuridad
air|aire
sea|mar
ocean|océano
river|río
lake|lago
mountain|montaña
hill|colina
forest|bosque
tree|árbol
trees|árboles
leaf|hoja (de planta)
flower|flor
flowers|flores
roses|rosas
grass|hierba
garden|jardín
desert|desierto; abandonar
sand|arena
stone|piedra
rock|roca; balancear
island|isla
field|campo
path|sendero; ruta
road|carretera; camino
street|calle
house|casa
home|hogar; en casa
room|habitación; espacio
door|puerta
window|ventana
wall|pared; muro
floor|suelo; piso
roof|techo
bed|cama
table|mesa; tabla
chair|silla
book|libro; reservar
books|libros
page|página
pages|páginas
story|historia; relato
stories|historias; relatos
word|palabra
words|palabras
sentence|oración; sentencia
letter|letra; carta
picture|imagen; retrato
paper|papel
pen|bolígrafo; corral
pencil|lápiz
box|caja
hat|sombrero
coat|abrigo; capa
shoe|zapato
shoes|zapatos
clothes|ropa
food|comida
bread|pan
milk|leche
fruit|fruta
apple|manzana
tea|té
coffee|café
money|dinero
price|precio
shop|tienda; comprar
city|ciudad
town|pueblo; ciudad pequeña
village|aldea; pueblo
country|país; campo
school|escuela
family|familia
mother|madre
father|padre
parent|padre o madre
parents|padres
child|niño; niña; hijo
children|niños; hijos
boy|niño; muchacho
girl|niña; muchacha
man|hombre
men|hombres
woman|mujer
women|mujeres
person|persona
people|personas; pueblo
friend|amigo; amiga
friends|amigos; amigas
brother|hermano
sister|hermana
son|hijo
daughter|hija
king|rey
queen|reina
prince|príncipe
princess|princesa
pilot|piloto
teacher|profesor; profesora
doctor|médico; doctora
stranger|desconocido; desconocida
animal|animal
animals|animales
dog|perro
cat|gato
fox|zorro
foxes|zorros
sheep|oveja; ovejas
lamb|cordero
snake|serpiente
boa|boa (serpiente)
elephant|elefante
bird|pájaro; ave
horse|caballo
fish|pez; pescado; pescar
chicken|pollo; gallina
head|cabeza; jefe
face|cara; afrontar
eye|ojo
eyes|ojos
ear|oreja; oído
mouth|boca
hand|mano
hands|manos
arm|brazo
leg|pierna
foot|pie
feet|pies
heart|corazón
voice|voz
hair|cabello; pelo
body|cuerpo
mind|mente; importar; cuidar
dream|sueño; soñar
idea|idea
question|pregunta
reason|razón; motivo
truth|verdad
lie|mentira; mentir; estar acostado
secret|secreto
problem|problema
danger|peligro
fear|miedo; temer
peace|paz
war|guerra
good|bueno
bad|malo
better|mejor
best|el mejor
worse|peor
worst|el peor
big|grande
large|grande; amplio
small|pequeño
long|largo; anhelar
short|corto; bajo de estatura
tall|alto de estatura
high|alto
low|bajo
old|viejo; antiguo
young|joven
new|nuevo
beautiful|hermoso; hermoso a la vista
pretty|bonito; bastante
ugly|feo
happy|feliz
sad|triste
angry|enojado
afraid|asustado; con miedo
lonely|solo; solitario
tired|cansado
hungry|hambriento
thirsty|sediento
kind|amable; tipo
gentle|suave; amable
brave|valiente
clever|inteligente; ingenioso
wise|sabio
foolish|necio; imprudente
strange|extraño
important|importante
different|diferente
same|mismo; igual
simple|sencillo
easy|fácil
difficult|difícil
hard|duro; difícil
soft|suave; blando
strong|fuerte
weak|débil
rich|rico
poor|pobre
full|lleno
empty|vacío
hot|caliente
cold|frío
warm|cálido; tibio
cool|fresco; sereno
wet|mojado
dry|seco
clean|limpio; limpiar
dirty|sucio
quiet|silencioso; tranquilo
loud|ruidoso; fuerte (sonido)
fast|rápido; ayunar
slow|lento
early|temprano
late|tarde; tardío
right|derecha; correcto; derecho
wrong|incorrecto; mal
true|verdadero
false|falso
real|real; verdadero
alone|solo; sin compañía
together|juntos
once|una vez
twice|dos veces
suddenly|de repente
slowly|lentamente
quickly|rápidamente
carefully|con cuidado
silently|en silencio
well|bien; pozo
please|por favor; complacer
thanks|gracias
thank|agradecer
hello|hola
goodbye|adiós
welcome|bienvenido; bienvenida
sorry|lo siento; arrepentido
everything|todo
something|algo
anything|cualquier cosa; algo
nothing|nada
everyone|todos; todo el mundo
someone|alguien
anyone|cualquiera; alguien
nobody|nadie
somewhere|en algún lugar
anywhere|en cualquier lugar
nowhere|en ninguna parte
everywhere|en todas partes
couldn't|no podía; no podría (could not)
can't|no puede; no puedo (cannot)
cannot|no poder
wouldn't|no haría; no lo haría (would not)
shouldn't|no debería (should not)
don't|no hago; no haces; no hacen (do not)
doesn't|no hace (does not)
didn't|no hizo (did not)
isn't|no es; no está (is not)
aren't|no son; no están (are not)
wasn't|no era; no estaba (was not)
weren't|no eran; no estaban (were not)
haven't|no he; no han (have not)
hasn't|no ha (has not)
hadn't|no había (had not)
won't|no hará; no lo hará (will not)
it's|es; está; ha (it is o it has)
that's|eso es; eso ha (that is o that has)
there's|hay; ha habido (there is o there has)
you're|eres; estás; son; están (you are)
they're|son; están (they are)
we're|somos; estamos (we are)
i'm|soy; estoy (I am)
`;
  const entries = Object.create(null);
  for (const row of rows.trim().split('\n')) {
    const [word, meaning] = row.split('|');
    if (!word || !meaning || Object.hasOwn(entries, word)) throw new Error('Entrada de diccionario inválida: ' + word);
    entries[word] = Object.freeze([meaning, '']);
  }
  Object.freeze(entries);
  if (typeof module !== 'undefined' && module.exports) module.exports = entries;
  else root.ReadLingoDictionary = entries;
})(typeof globalThis !== 'undefined' ? globalThis : this);

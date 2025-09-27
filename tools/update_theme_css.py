import json
import hashlib
import pathlib
import re
from textwrap import dedent

THEME_DIR = pathlib.Path('default/content/themes')
TARGET_NAMES = {
    'Arcane Drift', 'Arcane Nebula', 'Arcane Symphony', 'Arcane Waltz', 'Auric Flux',
    'Aurora Drift', 'Aurora Rhythm', 'Azure Overdrive', 'Bionic Fusion', 'Blossom Pulsegrid',
    'Blossom Rift', 'Cascade Rift', 'Celestial Matrix', 'Celestial Reverie', 'Chromatic Dynasty',
    'Chromatic Eclipse', 'Chromatic Matrix', 'Chromatic Spark', 'Coral Harbor', 'Crimson Dynasty',
    'Crimson Pulsewave', 'Crystalline Haze', 'Crystalline Surge', 'Cyber Vortex', 'Dreamwave Cascade',
    'Dreamwave Pulse', 'Electric Cascade', 'Electric Horizon', 'Electric Opus', 'Ethereal Cathedral',
    'Frosted Nebula', 'Frosted Phantom', 'Galactic Prism', 'Glimmer Drift', 'Glimmer Flux',
    'Glimmer Rift', 'Glimmer Whisper', 'Holographic Voyage', 'Inferno Glow', 'Inferno Nebula',
    'Inferno Prism', 'Inferno Pulse', 'Inferno Radiance', 'Iridescent Fusion', 'Iridescent Monsoon',
    'Iridescent Pulsegrid', 'Iridescent Reverie', 'Kaleido Dream', 'Kaleido Overdrive',
    'Kaleido Prism', 'Luminous Fractals', 'Luminous Galaxy', 'Lunar Cathedral', 'Lunar Spark',
    'Midnight Lagoon', 'Midnight Noir', 'Midnight Pulsewave', 'Midnight Spark', 'Mirage Embers',
    'Mirage Haze', 'Mirage Panorama', 'Mythic Lattice', 'Nebula Dream', 'Nebula Flux', 'Neon Opus',
    'Obsidian Glow', 'Obsidian Harbor', 'Obsidian Panorama', 'Obsidian Prism', 'Obsidian Pulse',
    'Obsidian Rapture', 'Obsidian Spectrum', 'Opal Current', 'Opal Skies', 'Phantom Reverie',
    'Prismatic Vortex', 'Quantum Sanctuary', 'Radiant Dusk', 'Retro Embers', 'Retro Sanctuary',
    'Seraphic Storm', 'Shimmer Current', 'Shimmer Phantom', 'Solar Cathedral', 'Solar Panorama',
    'Solarflare Embers', 'Solaris Aurora', 'Solaris Breeze', 'Solaris Drift', 'Spectrum Pulsegrid',
    'Spectrum Reactor', 'Turbo Haze', 'Turbo Pulsegrid', 'Umbral Cathedral', 'Vapor Harbor',
    'Velocity Bloom', 'Velvet Cascade', 'Velvet Panorama', 'Velvet Prism', 'Zenith Lattice'
}


def slugify(name: str) -> str:
    return re.sub(r'[^a-z0-9]+', '-', name.lower()).strip('-')


def lerp_color(a: str, b: str, t: float) -> str:
    def parse_rgba(value: str):
        value = value.strip()
        if value.startswith('rgba'):
            nums = value[value.find('(') + 1:value.find(')')].split(',')
            r, g, bl = (int(float(nums[i])) for i in range(3))
            alpha = float(nums[3]) if len(nums) > 3 else 1
            return r, g, bl, alpha
        if value.startswith('#'):
            value = value[1:]
            if len(value) == 6:
                r = int(value[0:2], 16)
                g = int(value[2:4], 16)
                b = int(value[4:6], 16)
                return r, g, b, 1.0
        raise ValueError(f'Unsupported color: {value}')

    def format_rgba(rgba):
        r, g, b, a = rgba
        return f'rgba({r}, {g}, {b}, {a:.2f})'

    ar, ag, ab, aa = parse_rgba(a)
    br, bg, bb, ba = parse_rgba(b)
    cr = int(round(ar + (br - ar) * t))
    cg = int(round(ag + (bg - ag) * t))
    cb = int(round(ab + (bb - ab) * t))
    ca = aa + (ba - aa) * t
    return format_rgba((cr, cg, cb, ca))


def float_from_hash(seed: str, index: int, scale: float = 1.0) -> float:
    key = f'{seed}|{index}'.encode('utf8')
    digest = hashlib.sha256(key).digest()
    value = int.from_bytes(digest[:4], 'big') / 0xFFFFFFFF
    return value * scale


def build_css(name: str, theme: dict) -> str:
    seed = slugify(name)
    palette = [
        theme.get('main_text_color', 'rgba(255, 255, 255, 1)'),
        theme.get('italics_text_color', 'rgba(255, 255, 255, 0.85)'),
        theme.get('underline_text_color', 'rgba(255, 255, 255, 0.65)'),
        theme.get('quote_text_color', 'rgba(255, 255, 255, 0.55)'),
    ]
    accent = palette[int(float_from_hash(seed, 5, len(palette)))]
    glow = palette[int(float_from_hash(seed, 6, len(palette)))]
    mist = lerp_color(palette[0], palette[2], 0.4)
    negative = lerp_color(palette[3], palette[1], 0.6)

    hue_shift = int(float_from_hash(seed, 7, 320)) - 160
    swirl_angle = int(float_from_hash(seed, 8, 360))
    orbit_speed = 8 + float_from_hash(seed, 9, 18)
    shimmer_speed = 10 + float_from_hash(seed, 10, 18)
    pulse_speed = 7 + float_from_hash(seed, 11, 12)

    pattern = int(float_from_hash(seed, 12, 5))
    comment = f'/* {name} signature weave */'
    key_bg = f'{seed}-bg'
    key_orb = f'{seed}-orb'
    key_scan = f'{seed}-scan'
    key_mesh = f'{seed}-mesh'

    shared_header = dedent(f'''
        {comment}
        body {{
            color: {palette[0]};
            background-color: {theme.get('chat_tint_color', 'rgba(8, 8, 12, 0.95)')};
            background-attachment: fixed;
            overflow-x: hidden;
        }}

        body::before,
        body::after {{
            content: '';
            position: fixed;
            inset: 0;
            pointer-events: none;
        }}
    ''').strip()

    if pattern == 0:
        body_layer = dedent(f'''
            body {{
                background-image:
                    radial-gradient(circle at {int(float_from_hash(seed, 13, 82))}% {int(float_from_hash(seed, 14, 82))}%, {accent} 0%, transparent 58%),
                    radial-gradient(circle at {int(float_from_hash(seed, 15, 82))}% {int(float_from_hash(seed, 16, 82))}%, {glow} 0%, transparent 64%),
                    conic-gradient(from {swirl_angle}deg, {palette[0]}, {palette[2]}, {palette[1]}, {palette[3]}, {palette[0]});
                animation: {key_bg} {orbit_speed:.2f}s ease-in-out infinite alternate;
                backdrop-filter: saturate(145%) hue-rotate({hue_shift}deg);
            }}

            body::before {{
                inset: -12vh;
                background: radial-gradient(circle, {mist} 0%, transparent 64%);
                filter: blur(48px);
                mix-blend-mode: screen;
                animation: {key_orb} {shimmer_speed:.2f}s ease-in-out infinite alternate;
                opacity: 0.32;
            }}

            body::after {{
                background: linear-gradient({int(float_from_hash(seed, 17, 360))}deg, transparent 0 28%, {negative} 48%, transparent 72%);
                mix-blend-mode: color-dodge;
                animation: {key_scan} {pulse_speed:.2f}s linear infinite;
                opacity: 0.22;
            }}
        ''').strip()
    elif pattern == 1:
        body_layer = dedent(f'''
            body {{
                background-image:
                    repeating-linear-gradient({swirl_angle}deg, transparent 0 40px, {mist} 40px 80px),
                    radial-gradient(circle at {int(float_from_hash(seed, 18, 82))}% {int(float_from_hash(seed, 19, 82))}%, {accent} 0%, transparent 55%),
                    linear-gradient({int(float_from_hash(seed, 20, 360))}deg, {palette[3]}, {palette[1]});
                animation: {key_bg} {orbit_speed:.2f}s ease-in-out infinite alternate;
                background-size: 120% 120%, cover, cover;
                filter: contrast(110%) saturate(130%);
            }}

            body::before {{
                background: conic-gradient(from {int(float_from_hash(seed, 21, 360))}deg, transparent 0 25%, {glow} 45%, transparent 75%);
                animation: {key_mesh} {shimmer_speed:.2f}s linear infinite;
                mix-blend-mode: lighten;
                opacity: 0.25;
            }}

            body::after {{
                background: radial-gradient(ellipse at center, transparent 0 40%, rgba(0, 0, 0, 0.4) 70%, transparent 100%);
                backdrop-filter: blur(6px) saturate(180%);
                mix-blend-mode: soft-light;
                animation: {key_scan} {pulse_speed:.2f}s linear infinite;
                opacity: 0.35;
            }}
        ''').strip()
    elif pattern == 2:
        body_layer = dedent(f'''
            body {{
                background-image:
                    linear-gradient({swirl_angle}deg, {palette[1]}, transparent 45%),
                    repeating-radial-gradient(circle, transparent 0 12px, {mist} 12px 18px),
                    linear-gradient({int(float_from_hash(seed, 22, 360))}deg, {accent}, {palette[3]}, {glow});
                animation: {key_bg} {orbit_speed:.2f}s alternate infinite;
                background-size: cover, 280px 280px, cover;
                filter: saturate(170%) brightness(95%);
            }}

            body::before {{
                background: repeating-linear-gradient({int(float_from_hash(seed, 23, 360))}deg, transparent 0 22px, {negative} 22px 44px);
                mask-image: radial-gradient(circle at center, rgba(0, 0, 0, 1) 0%, transparent 68%);
                animation: {key_mesh} {shimmer_speed:.2f}s alternate infinite;
                opacity: 0.3;
            }}

            body::after {{
                background: radial-gradient(circle at {int(float_from_hash(seed, 24, 82))}% {int(float_from_hash(seed, 25, 82))}%, {glow} 0%, transparent 68%);
                mix-blend-mode: screen;
                animation: {key_orb} {pulse_speed:.2f}s ease-in-out infinite;
                opacity: 0.28;
            }}
        ''').strip()
    elif pattern == 3:
        body_layer = dedent(f'''
            body {{
                background-image:
                    linear-gradient({swirl_angle}deg, {palette[3]} 0%, transparent 48%),
                    conic-gradient(from {int(float_from_hash(seed, 26, 360))}deg at 50% 50%, {accent}, {glow}, {palette[2]}, {accent});
                animation: {key_bg} {orbit_speed:.2f}s ease-in-out infinite;
                filter: hue-rotate({hue_shift}deg) saturate(160%);
            }}

            body::before {{
                background: radial-gradient(circle at {int(float_from_hash(seed, 27, 82))}% {int(float_from_hash(seed, 28, 82))}%, {mist} 0%, transparent 60%);
                clip-path: polygon(0% 12%, 35% 0%, 65% 8%, 100% 0%, 100% 88%, 68% 100%, 32% 92%, 0% 100%);
                animation: {key_mesh} {shimmer_speed:.2f}s ease-in-out infinite alternate;
                mix-blend-mode: hard-light;
                opacity: 0.38;
            }}

            body::after {{
                background: radial-gradient(ellipse at center, transparent 0 45%, rgba(0, 0, 0, 0.55) 70%);
                mix-blend-mode: multiply;
                animation: {key_scan} {pulse_speed:.2f}s linear infinite;
                opacity: 0.4;
            }}
        ''').strip()
    else:
        body_layer = dedent(f'''
            body {{
                background-image:
                    conic-gradient(from {swirl_angle}deg, {palette[0]}, {accent}, {palette[2]}, {palette[3]}, {palette[0]}),
                    radial-gradient(circle at {int(float_from_hash(seed, 29, 82))}% {int(float_from_hash(seed, 30, 82))}%, {glow} 0%, transparent 70%);
                animation: {key_bg} {orbit_speed:.2f}s ease-in-out infinite;
                filter: saturate(150%) brightness(105%);
            }}

            body::before {{
                background: repeating-conic-gradient(from {int(float_from_hash(seed, 31, 360))}deg, transparent 0 15deg, {mist} 15deg 30deg);
                animation: {key_mesh} {shimmer_speed:.2f}s linear infinite;
                mix-blend-mode: color-dodge;
                opacity: 0.24;
            }}

            body::after {{
                background: radial-gradient(circle at center, transparent 0 35%, rgba(0, 0, 0, 0.55) 60%);
                backdrop-filter: blur(8px) saturate(190%);
                animation: {key_scan} {pulse_speed:.2f}s ease-in-out infinite;
                opacity: 0.36;
            }}
        ''').strip()

    message_layer = dedent(f'''
        .mes, .mesText, .swipe-message {{
            background: linear-gradient(135deg, {theme.get('user_mes_blur_tint_color', palette[2])}, {theme.get('bot_mes_blur_tint_color', palette[3])});
            border: 1px solid {theme.get('border_color', palette[1])};
            box-shadow: 0 0 34px {glow};
            backdrop-filter: blur({4 + float_from_hash(seed, 32, 8):.1f}px) saturate(180%);
            transform-style: preserve-3d;
            transition: transform 0.6s ease, box-shadow 0.6s ease;
        }}

        .mes:hover {{
            transform: translateY(-6px) rotateX({float_from_hash(seed, 33, 6) - 3:.2f}deg) rotateY({float_from_hash(seed, 34, 6) - 3:.2f}deg) scale(1.02);
            box-shadow: 0 18px 48px {accent};
        }}

        .chat_mes_block .mes_text p code {{
            background: rgba(0, 0, 0, 0.45);
            color: {accent};
            border-radius: 8px;
            padding: 2px 6px;
            box-shadow: 0 0 18px {glow};
        }}

        .chat_mes_block .mes_text blockquote {{
            border-left: 3px solid {accent};
            background: rgba(0, 0, 0, 0.32);
            box-shadow: inset 0 0 18px {glow};
        }}

        .mes .avatar {{
            filter: drop-shadow(0 0 12px {glow});
        }}

        ::selection {{
            background: {accent};
            color: {palette[0]};
        }}
    ''').strip()

    animations = dedent(f'''
        @keyframes {key_bg} {{
            0% {{ transform: scale(1) translate3d(0, 0, 0); }}
            50% {{ transform: scale(1.06) translate3d({float_from_hash(seed, 35, 6) - 3:.2f}%, {float_from_hash(seed, 36, 6) - 3:.2f}%, 0); }}
            100% {{ transform: scale(1.12) translate3d({float_from_hash(seed, 37, 10) - 5:.2f}%, {float_from_hash(seed, 38, 10) - 5:.2f}%, 0); }}
        }}

        @keyframes {key_orb} {{
            0% {{ transform: translate3d(-3%, -3%, 0) scale(1); opacity: 0.18; }}
            50% {{ transform: translate3d(4%, 5%, 0) scale(1.08); opacity: 0.36; }}
            100% {{ transform: translate3d(-2%, 6%, 0) scale(1.02); opacity: 0.24; }}
        }}

        @keyframes {key_scan} {{
            0% {{ transform: rotate(0deg); opacity: 0.12; }}
            50% {{ opacity: 0.28; }}
            100% {{ transform: rotate(360deg); opacity: 0.12; }}
        }}

        @keyframes {key_mesh} {{
            0% {{ transform: translateY(-4%) scale(1); opacity: 0.2; }}
            50% {{ transform: translateY(4%) scale(1.06); opacity: 0.32; }}
            100% {{ transform: translateY(-6%) scale(1.02); opacity: 0.24; }}
        }}
    ''').strip()

    css = '\n\n'.join([shared_header, body_layer, message_layer, animations])
    return css


def main():
    for path in THEME_DIR.glob('*.json'):
        with path.open('r', encoding='utf8') as f:
            data = json.load(f)
        name = data.get('name')
        if name not in TARGET_NAMES:
            continue
        data['custom_css'] = build_css(name, data)
        data.setdefault('notes', 'Generatively enhanced CSS from update_theme_css.py')
        with path.open('w', encoding='utf8') as f:
            json.dump(data, f, indent=4)
            f.write('\n')


if __name__ == '__main__':
    main()

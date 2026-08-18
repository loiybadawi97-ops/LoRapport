import os
import re

icon_map = {
    'fitness_center': 'Dumbbell',
    'login': 'LogIn',
    'home_app_logo': 'LayoutDashboard',
    'chat_bubble': 'MessageCircle',
    'mic': 'Mic',
    'timer': 'Timer',
    'menu_book': 'BookOpen',
    'monitoring': 'Activity',
    'arrow_back': 'ArrowLeft',
    'stop_circle': 'StopCircle',
    'smart_toy': 'Bot',
    'person': 'User',
    'star': 'Star',
    'model_training': 'Brain',
    'send': 'Send',
    'graphic_eq': 'Activity',
    'local_fire_department': 'Flame',
    'verified': 'CheckCircle2',
    'check_circle': 'CheckCircle2',
    'lightbulb': 'Lightbulb',
    'replay': 'RotateCcw',
    'analytics': 'LineChart',
    'auto_fix_high': 'Sparkles',
    'directions_walk': 'Footprints',
    'emoji_events': 'Trophy',
    'stars': 'Stars',
    'cloud_done': 'CloudOff', # actually Cloud icon for cloud_done but Cloud uses Lucide Cloud
    'workspace_premium': 'Crown',
    'help': 'HelpCircle',
    'bolt': 'Zap',
    'arrow_forward': 'ArrowRight',
    'self_improvement': 'HeartPulse',
    'close': 'X',
    'record_voice_over': 'Mic2'
}

def replace_icons(content, file_path):
    imports = set()
    
    # Simple regex to find material symbols
    pattern = r'<span[^>]*class(?:Name)?=["\'].*?material-symbols-outlined.*?.(?:>|\}|>)(.*?)</span\s*>'
    
    def replacer(match):
        full_match = match.group(0)
        icon_name = match.group(1).strip()
        
        if icon_name in icon_map:
            lucide_icon = icon_map[icon_name]
            imports.add(lucide_icon)
            
            # Extract class names to preserve styling
            class_match = re.search(r'class(?:Name)?=["\'](.*?)["\']', full_match)
            classes = class_match.group(1) if class_match else ''
            classes = classes.replace('material-symbols-outlined', '').strip()
            
            return f'<{lucide_icon} className="{classes}" />'
        return full_match
        
    new_content = re.sub(pattern, replacer, content)
    
    if imports:
        import_stmt = f"import {{ {', '.join(imports)} }} from 'lucide-react';\n"
        # add after React import
        new_content = re.sub(r'(import React.*?;\n)', r'\1' + import_stmt, new_content, count=1)
        
    return new_content

for root, _, files in os.walk('src'):
    for file in files:
        if file.endswith('.tsx') or file.endswith('.ts'):
            path = os.path.join(root, file)
            with open(path, 'r') as f:
                content = f.read()
            new_content = replace_icons(content, path)
            if new_content != content:
                with open(path, 'w') as f:
                    f.write(new_content)
                print(f"Updated {path}")

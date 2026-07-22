#!/usr/bin/env python3
import requests
import re
import os

# Get the repository owner from environment or use default
github_user = os.environ.get('GITHUB_REPOSITORY_OWNER', 'TiagoCoutinho3')

# GitHub API search for user's commits
url = f"https://api.github.com/search/commits?q=author:{github_user}+is:public"
headers = {"Accept": "application/vnd.github.v3+json"}

try:
    response = requests.get(url, headers=headers)
    response.raise_for_status()
    data = response.json()
    commit_count = data.get('total_count', 0)
    
    # Read README.md
    readme_path = os.path.join(os.path.dirname(os.path.dirname(__file__)), 'README.md')
    with open(readme_path, 'r', encoding='utf-8') as f:
        content = f.read()
    
    # Update the snake section title with commit count
    new_title = f"## 🐍 Snake ({commit_count:,} commits)"
    content = re.sub(
        r'## 🐍 Snake(?: \(\d+ commits\))?',
        new_title,
        content
    )
    
    # Write back to README.md
    with open(readme_path, 'w', encoding='utf-8') as f:
        f.write(content)
    
    print(f"Updated commit count to {commit_count:,}")
    
except Exception as e:
    print(f"Error: {e}")
    exit(1)

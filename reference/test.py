import requests
import os
from datetime import datetime, timezone
import json

# --- Configuration ---
# Ensure you replace this with your actual URL and token.
CANVAS_URL = "https://dlsu.instructure.com/" 
ACCESS_TOKEN = "10225~f8NUVJnLAXVFrBEyhTHTcuNkvwHk6nTfh2P44CUWAEH9ahVE7wfQfxcQcHCJhauT"

# --- Functions ---

def get_favorite_courses():
    """Fetches the user's favorite courses."""
    url = f"{CANVAS_URL}/api/v1/users/self/favorites/courses"
    headers = {"Authorization": f"Bearer {ACCESS_TOKEN}"}
    response = requests.get(url, headers=headers)
    response.raise_for_status()
    return response.json()

def get_assignments(course_id):
    """Fetches all assignments for a given course."""
    assignments = []
    url = f"{CANVAS_URL}/api/v1/courses/{course_id}/assignments"
    headers = {"Authorization": f"Bearer {ACCESS_TOKEN}"}
    params = {'include[]': ['submission'], 'per_page': 100}

    while url:
        response = requests.get(url, headers=headers, params=params)
        params = None
        response.raise_for_status()
        assignments.extend(response.json())
        url = None
        if 'Link' in response.headers:
            links = response.headers['Link'].split(',')
            for link in links:
                if 'rel="next"' in link:
                    url = link.split(';')[0].strip()[1:-1]
                    break
    return assignments

def get_announcements(course_ids):
    """Fetches all announcements for the given course IDs."""
    announcements = []
    context_codes = [f"course_{cid}" for cid in course_ids]
    url = f"{CANVAS_URL}/api/v1/announcements"
    headers = {"Authorization": f"Bearer {ACCESS_TOKEN}"}
    params = {'context_codes[]': context_codes, 'per_page': 100}

    while url:
        response = requests.get(url, headers=headers, params=params)
        params = None
        response.raise_for_status()
        announcements.extend(response.json())
        url = None
        if 'Link' in response.headers:
            links = response.headers['Link'].split(',')
            for link in links:
                if 'rel="next"' in link:
                    url = link.split(';')[0].strip()[1:-1]
                    break
    return announcements


def process_assignment(assignment, course_id):
    """
    Helper function to structure assignment data for the 'entities' block.
    Now includes an optional 'grade' field if the assignment is graded.
    """
    processed_data = {
        'id': assignment['id'],
        'name': assignment['name'],
        'course_id': course_id,
        'due_at': assignment.get('due_at'),
        'html_url': assignment.get('html_url'),
        'points_possible': assignment.get('points_possible'),
        'submission_status': "Not Submitted",
        'assignment_group_id': assignment.get('assignment_group_id')
    }
    submission_data = assignment.get('submission')
    if submission_data and submission_data.get('workflow_state') != 'unsubmitted':
        workflow_state = submission_data['workflow_state']
        processed_data['submission_status'] = workflow_state.replace('_', ' ').title()
        if workflow_state == 'graded' and submission_data.get('score') is not None:
            processed_data['grade'] = submission_data.get('score')
    return processed_data

def main():
    """
    Main function to gather all data and save it as a structured,
    normalized JSON file with announcements.
    """
    if not ACCESS_TOKEN or "YOUR_ACCESS_TOKEN" in ACCESS_TOKEN:
        print("Error: Please set your Canvas Access Token in the script.")
        return

    try:
        favorite_courses = get_favorite_courses()
        if not favorite_courses:
            print("No favorite courses found.")
            return

        entities = {"courses": {}, "assignments": {}, "announcements": {}}
        views = {
            "upcoming_assignments": [],
            "unsubmitted_assignments": [],
            "assignments_by_course": {},
            "announcements_by_course": {}
        }
        
        print("Fetching data from Canvas...")
        
        course_ids = [course['id'] for course in favorite_courses]
        
        for course in favorite_courses:
            course_id = course['id']
            print(f"  - Processing course: {course['name']} (ID: {course_id})")
            
            entities["courses"][course_id] = {"id": course_id, "name": course['name']}
            views["assignments_by_course"][course_id] = []
            views["announcements_by_course"][course_id] = []
            
            all_assignments_for_course = get_assignments(course_id)
            
            for assignment in all_assignments_for_course:
                assignment_id = assignment['id']
                processed_assignment = process_assignment(assignment, course_id)
                entities["assignments"][assignment_id] = processed_assignment
                views["assignments_by_course"][course_id].append(assignment_id)
                
                is_submitted = processed_assignment['submission_status'] not in ["Not Submitted"]
                due_at_str = processed_assignment.get('due_at')

                if not is_submitted and due_at_str:
                    due_date = datetime.fromisoformat(due_at_str.replace('Z', '+00:00'))
                    now = datetime.now(timezone.utc)
                    if due_date > now:
                         views['upcoming_assignments'].append(assignment_id)
                    else:
                        views['unsubmitted_assignments'].append(assignment_id)

        # Fetch all announcements for favorite courses in one API call
        all_announcements = get_announcements(course_ids)
        for announcement in all_announcements:
            # The context_code is in the format "course_123"
            course_id = int(announcement['context_code'].split('_')[1])
            announcement_id = announcement['id']
            
            entities['announcements'][announcement_id] = {
                'id': announcement_id,
                'title': announcement['title'],
                'posted_at': announcement['posted_at'],
                'url': announcement['url'],
                'course_id': course_id
            }
            views['announcements_by_course'][course_id].append(announcement_id)


        output_data = {
            'report_generated_on': datetime.now(timezone.utc).isoformat(),
            'entities': entities,
            'views': views
        }
        
        with open('context_final.json', 'w', encoding='utf-8') as f:
            json.dump(output_data, f, ensure_ascii=False, indent=4)
        
        print("\nFinal output successfully saved to context_final.json")
        print(f"Found {len(entities['courses'])} courses, {len(entities['assignments'])} total assignments, and {len(entities['announcements'])} announcements.")

    except requests.exceptions.RequestException as e:
        print(f"\nAn API error occurred: {e}")
    except Exception as e:
        print(f"\nAn unexpected error occurred: {e}")

if __name__ == "__main__":
    main()

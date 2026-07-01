from typing import Dict


ATTACK_MAP = {
    "T1001": "Data Obfuscation",
    "T1059": "Command and Scripting Interpreter",
    "T1071": "Application Layer Protocol",
}


def map_to_mitre(technique_id: str) -> Dict[str, str]:
    return {
        "technique_id": technique_id,
        "name": ATTACK_MAP.get(technique_id, "Unknown Technique"),
    }


if __name__ == "__main__":
    print(map_to_mitre("T1059"))

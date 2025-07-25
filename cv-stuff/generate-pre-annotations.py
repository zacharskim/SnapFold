import json

# Load your labeled template annotation result
with open("template_annotation.json") as f:
    template_result = json.load(f)['annotations'][0]['result']

# Manually generate a list of tasks using known frame paths
# Adjust range as needed — here it's 1 to 2000
tasks = []
for i in range(1, 2231):
    tasks.append({
        "data": {
            "hand_img": f"s3://poker-ocr/frames/frame_{i:04d}.png"
        }
    })

# Create predictions for all tasks using the same bounding boxes
predictions = []
for task in tasks:
    predictions.append({
        "data": task["data"],
        "predictions": [{
            "model_version": "box_template_v1",
            "result": template_result
        }]
    })

# Save the predictions JSON
with open("predictions.json", "w") as f:
    json.dump(predictions, f, indent=2)


#ok this actually works looks like! but need to clean up local image studio stuff
#ie remove wrong images / extra ones,
# remove the images that just don't show any new data etc...
# then apply the label to the remains ones
# then like manually ensure those are correct labels
#THEN approve them and export the imgs to yolo format...
#start extracting value etc!!

